import admin from 'firebase-admin';

// Initialize Firebase Admin (Singleton pattern for Serverless)
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

  const payload = req.body || {};
  console.log("--- ZALO WEBHOOK INCOMING ---");
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Body:", JSON.stringify(payload));

  // 1. Authenticate (Loosened for initial sync/debugging)
  const secretToken = req.headers['x-bot-api-secret-token'] || req.headers['x-zevents-signature'];
  console.log("Secret/Signature received:", secretToken);

  // 2. EXTREME RESILIENT EXTRACTION
  // Try to find ANY ID-like field if standard ones fail
  let fromUid = payload.sender?.id || 
                payload.result?.message?.from?.id || 
                payload.user_id || 
                payload.sender_id || 
                payload.from_id ||
                payload.uid;

  let messageText = (payload.message?.text || 
                     payload.result?.message?.text || 
                     payload.message || 
                     "").toString().trim();

  let eventName = payload.event_name || payload.result?.event_name || "unknown";

  console.log(`EXTRACTED DATA -> UID: ${fromUid}, Msg: "${messageText}", Event: ${eventName}`);

  // 3. Early Exit if we still can't find an ID
  if (!fromUid) {
    console.error("FAILED TO LOCATE SENDER ID IN PAYLOAD");
    return res.status(200).json({ ok: true, error: 'could_not_locate_id' });
  }

  const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
  
  // Helper to respond
  const reply = async (text) => {
    if (!BOT_TOKEN) {
      console.error("MISSING ZALO_BOT_TOKEN");
      return;
    }
    console.log(`Replying to ${fromUid}...`);
    try {
      const response = await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: fromUid, text })
      });
      const data = await response.json();
      console.log("Zalo API Reply Result:", JSON.stringify(data));
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  };

  // Logic match
  const isIdReq = messageText.toLowerCase().includes('id');
  const syncMatch = messageText.match(/(\d{6})/);

  if (syncMatch) {
    const code = syncMatch[1];
    const syncRef = db.collection('zalo_sync').doc(code);
    const snap = await syncRef.get();
    if (snap.exists && snap.data().status === 'pending') {
      await syncRef.update({
        status: 'completed',
        chat_id: fromUid,
        linked_at: admin.firestore.FieldValue.serverTimestamp()
      });
      await reply(`✅ KẾT NỐI THÀNH CÔNG!\nID của ngài đã được IRIS lưu trữ.\nChúc ngài một ngày tràn đầy năng lượng! 💧`);
      return res.status(200).json({ ok: true });
    }
  }

  if (isIdReq) {
    await reply(`✅ THÔNG TIN ĐỊNH DANH\nID Zalo của ngài là: ${fromUid}\n\nNgài hãy dán mã này vào website để hoàn tất thiết lập nhắc nhở AI.`);
    return res.status(200).json({ ok: true });
  }

  // Acknowledge all other events
  console.log("Unhandled event type or content.");
  return res.status(200).json({ ok: true });
}
