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
      
      // Setup delayed intro in Firestore if not exists
      const sessionRef = db.collection('hydration_sessions').doc(fromUid);
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) {
        await sessionRef.set({
          chat_id: fromUid,
          name: "Ngài",
          intro_sent: false,
          intro_at: admin.firestore.Timestamp.fromMillis(Date.now() + 3 * 60 * 1000), // 3 mins later
          created_at: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    }
  } else {
    // INTERACTIVE LOGIC
    const sessionRef = db.collection('hydration_sessions').doc(fromUid);
    const sessionDoc = await sessionRef.get();

    if (sessionDoc.exists) {
      const session = sessionDoc.data();
      const lowerMsg = messageText.toLowerCase();

      // 1. CANCEL PLAN
      if (lowerMsg.includes('hủy') && lowerMsg.includes('kế hoạch')) {
        await sessionRef.delete();
        await reply(`🗑️ ĐÃ HỦY KẾ HOẠCH\n\nIRIS AI đã xóa toàn bộ lịch trình và ngừng nhắc nhở. Ngài có thể lập kế hoạch mới bất cứ lúc nào trên website.`);
        return res.status(200).json({ ok: true });
      }

      // 2. ACKNOWLEDGE DRINKING
      const okKeywords = ['ok', 'xong', 'rồi', 'đã uống', 'done', 'uống rồi'];
      if (okKeywords.some(kw => lowerMsg.includes(kw))) {
        let schedule = session.schedule || [];
        // Find most recent 'sent' reminder
        const sentIndex = [...schedule].reverse().findIndex(item => item.status === 'sent');
        
        if (sentIndex !== -1) {
          const actualIndex = schedule.length - 1 - sentIndex;
          schedule[actualIndex].status = 'completed';
          
          // Increment consumed
          const amountStr = schedule[actualIndex].amount || "0";
          const amountVal = parseInt(amountStr.replace(/[^0-9]/g, '')) || 0;
          const newConsumed = (session.consumed || 0) + (amountVal / 1000); // convert ml to L
          
          await sessionRef.update({
            schedule,
            consumed: Number(newConsumed.toFixed(2)),
            last_drink_at: admin.firestore.FieldValue.serverTimestamp()
          });

          await reply(`✅ TUYỆT VỜI!\n\nIRIS đã ghi nhận ngài vừa nạp ${amountVal}ml.\nTiến độ: ${Number(newConsumed.toFixed(2))}/${session.total_target} Lít.\n\nCố gắng duy trì phong độ nhé ngài! 💪`);
        } else {
          await reply(`🤔 IRIS chưa thấy lịch nhắc gần đây. Có thể ngài đã uống vượt kế hoạch? Rất tốt ạ!`);
        }
        return res.status(200).json({ ok: true });
      }
    }

    // FALLBACK: Default response
    await reply(`🤖 Chào ngài, IRIS AI đã nhận được tin nhắn.\n\nĐể liên kết Zalo Bot và nhận nhắc nhở tự động, ngài hãy truy cập trang web: https://www.bct0902.top để thực hiện lập kế hoạch AI nhé! 💧`);
  }

  return res.status(200).json({ ok: true });
}
