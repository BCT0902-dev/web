import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton pattern for Serverless)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Authenticate with Zalo Secret Token (MANDATORY per user request)
  const secretToken = req.headers['x-bot-api-secret-token'];
  const VALID_SECRET = '12345678'; // Hardcoded as per user request
  
  if (secretToken !== VALID_SECRET) {
    console.warn("Unauthorized webhook attempt");
    return res.status(403).json({ ok: false, description: 'Unauthorized' });
  }

  const payload = req.body;
  console.log("Received Zalo Webhook:", JSON.stringify(payload));

  // 2. Extract Message Info
  const event = payload.result;
  if (!event || event.event_name !== 'message.text.received') {
    return res.status(200).json({ ok: true, description: 'Event ignored' });
  }

  const messageText = event.message.text.trim();
  const fromUid = event.message.from.id;
  const displayName = event.message.from.display_name || 'Người dùng';
  const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

  // 3. Logic: Check for General "ID" Keyword OR Specific Sync Code
  const isGeneralIdRequest = messageText.toLowerCase().includes('id');
  const syncMatch = messageText.match(/ID\s?(\d{6})/i) || messageText.match(/^(\d{6})$/);
  
  if (syncMatch) {
    const code = syncMatch[1];
    const syncRef = db.collection('zalo_sync').doc(code);
    const doc = await syncRef.get();

    if (doc.exists && doc.data().status === 'pending') {
      await syncRef.update({
        status: 'completed',
        chat_id: fromUid,
        user_name: displayName,
        linked_at: admin.firestore.FieldValue.serverTimestamp()
      });

      if (BOT_TOKEN) {
        await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: fromUid,
            text: `✅ Nhập ID thành công!\nChào ${displayName}, IRIS đã nhận dạng được ID của bạn.\nHãy quay lại trình duyệt để tiếp tục.`
          })
        });
      }
      return res.status(200).json({ ok: true, result: 'Sync completed' });
    }
  }

  // Handle general "Any message with ID" as requested
  if (isGeneralIdRequest && BOT_TOKEN) {
    await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: fromUid,
        text: `✅ Nhập ID thành công!\nChào ${displayName},\nID Zalo của ngài là: ${fromUid}\n\nHãy sao chép mã này dán vào website IRIS AI để hoàn tất thiết lập.`
      })
    });
    return res.status(200).json({ ok: true, result: 'ID Sent' });
  }

  // Default response (acknowledge receipt)
  return res.status(200).json({ ok: true });
}
