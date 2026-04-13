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
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body || {};
  console.log("--- ZALO DEEP SCAN START ---");
  console.log("Full Payload:", JSON.stringify(payload));

  // 1. Hàm tự động tìm ID trong mọi ngóc ngách của dữ liệu
  const findId = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    
    // Thử các tên biến phổ biến trước
    const commonKeys = ['id', 'uid', 'user_id', 'sender_id', 'from_id', 'from'];
    for (let key of commonKeys) {
      if (obj[key] && typeof obj[key] === 'string' && obj[key].length > 10) return obj[key];
      if (obj[key] && typeof obj[key] === 'object' && obj[key].id) return obj[key].id;
    }

    // Nếu không thấy, lùng sục toàn bộ object
    for (let key in obj) {
      if (typeof obj[key] === 'object') {
        const found = findId(obj[key]);
        if (found) return found;
      } else if (typeof obj[key] === 'string' && obj[key].length > 10 && /^\d+$/.test(obj[key])) {
        // Nếu là một chuỗi số dài, khả năng cao là ID
        return obj[key];
      }
    }
    return null;
  };

  const fromUid = findId(payload);
  
  let messageText = (
    payload.message?.text || 
    payload.result?.message?.text || 
    payload.message || 
    ""
  ).toString().trim();

  console.log(`DEEP SCAN RESULT -> Found ID: ${fromUid}, Msg: "${messageText}"`);

  if (!fromUid) {
    console.error("CRITICAL: STILL CANNOT FIND ID IN PAYLOAD!");
    return res.status(200).json({ ok: true, error: 'id_not_found_even_in_deep_scan' });
  }

  const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
  
  const reply = async (text) => {
    if (!BOT_TOKEN) return console.error("MISSING BOT TOKEN");
    console.log(`Replying to ${fromUid}...`);
    try {
      await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: fromUid, text })
      });
    } catch (e) { console.error("Reply Error:", e); }
  };

  // Logic phản hồi
  if (messageText.toLowerCase().includes('id') || messageText.match(/\d{6}/)) {
    const syncMatch = messageText.match(/(\d{6})/);
    if (syncMatch) {
      const code = syncMatch[1];
      await db.collection('zalo_sync').doc(code).update({
        status: 'completed',
        chat_id: fromUid,
        linked_at: admin.firestore.FieldValue.serverTimestamp()
      }).catch(() => {});
      await reply(`✅ THIẾT LẬP THÀNH CÔNG!\nIRIS đã kết nối với tài khoản của ngài.\nGiờ đây ngài có thể nhận lời nhắc uống nước tự động.`);
    } else {
      await reply(`✅ XÁC NHẬN KẾT NỐI\nID Zalo của ngài là: ${fromUid}\n\nNgài hãy dán mã này vào website IRIS AI để bắt đầu.`);
    }
  }

  return res.status(200).json({ ok: true });
}
