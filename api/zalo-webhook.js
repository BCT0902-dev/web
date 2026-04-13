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
  console.log("--- ZALO WEBHOOK START ---");
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Payload:", JSON.stringify(payload));

  // 1. Authenticate with Zalo Secret Token (MANDATORY)
  const secretToken = req.headers['x-bot-api-secret-token'];
  const VALID_SECRET = '12345678'; 
  
  if (secretToken !== VALID_SECRET) {
    console.warn("Unauthorized webhook attempt: secret mismatch");
    return res.status(403).json({ ok: false, description: 'Unauthorized secret' });
  }

  // 2. Extract Event Info (Handling multiple Zalo payload variants)
  // Variant A: { result: { event_name, message: { text, from: { id } } } }
  // Variant B: { event_name, sender: { id }, message: { text } }
  
  let eventName = payload.event_name || payload.result?.event_name;
  let messageText = (payload.message?.text || payload.result?.message?.text || "").trim();
  let fromUid = payload.sender?.id || payload.result?.message?.from?.id;
  let displayName = payload.sender?.display_name || payload.result?.message?.from?.display_name || 'Người dùng';

  console.log(`Detected: Event=${eventName}, From=${fromUid}, Text="${messageText}"`);

  if (!eventName || !fromUid) {
    console.warn("Missing critical event info");
    return res.status(200).json({ ok: true, description: 'Incomplete data' });
  }

  // 3. Logic: Check for General "ID" Keyword OR Specific Sync Code
  const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
  const isGeneralIdRequest = messageText.toLowerCase().includes('id');
  const syncMatch = messageText.match(/ID\s?(\d{6})/i) || messageText.match(/^(\d{6})$/);

  // Function to send message
  const sendMessage = async (text) => {
    if (!BOT_TOKEN) {
      console.error("CRITICAL: ZALO_BOT_TOKEN is not set in Environment Variables!");
      return;
    }
    console.log(`Sending message to ${fromUid}...`);
    const response = await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: fromUid, text })
    });
    const resData = await response.json();
    console.log("Zalo API Response:", JSON.stringify(resData));
  };

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

      await sendMessage(`✅ Nhập ID thành công!\nChào ${displayName}, IRIS đã nhận dạng được ID của bạn.\nHãy quay lại trình duyệt để tiếp tục.`);
      return res.status(200).json({ ok: true, result: 'Sync completed' });
    }
  }

  if (isGeneralIdRequest) {
    await sendMessage(`✅ Nhập ID thành công!\nChào ${displayName},\nID Zalo của ngài là: ${fromUid}\n\nHãy sao chép mã này dán vào website IRIS AI để hoàn tất thiết lập.`);
    return res.status(200).json({ ok: true, result: 'ID Sent' });
  }

  console.log("Event acknowledged but no logic applied.");
  return res.status(200).json({ ok: true });
}
