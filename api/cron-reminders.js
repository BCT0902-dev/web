import admin from 'firebase-admin';

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Optional: Verify request is from Vercel Cron (X-Vercel-Cron header)
  
  const now = new Date();
  const ictNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
  const HH = ictNow.getUTCHours().toString().padStart(2, '0');
  const mm = ictNow.getUTCMinutes().toString().padStart(2, '0');
  const currentTimeStr = `${HH}:${mm}`;

  console.log(`--- CRON RUNNING [ICT: ${currentTimeStr}] ---`);

  const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;
  const reply = async (chat_id, text) => {
    try {
      await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text })
      });
    } catch (e) { console.error("Cron Reply Error:", e); }
  };

  try {
    const sessionsSnap = await db.collection('hydration_sessions').get();
    
    for (const docSnap of sessionsSnap.docs) {
      const session = docSnap.data();
      const chatId = docSnap.id;
      let updated = false;

      // 1. Check for Intro Message (3 mins after sync)
      if (!session.intro_sent && session.intro_at) {
        if (now.getTime() >= session.intro_at.toDate().getTime()) {
          console.log(`Sending Intro to ${chatId}`);
          await reply(chatId, `🎉 CHÀO MỪNG NGÀI ĐẾN VỚI HỆ SINH THÁI IRIS AI!\n\nEm đã thiết lập xong hệ thống nhắc nhở tự động cho ngài. \n\nNgoài ra, ngài hãy khám phá thêm các siêu phẩm khác của em nhé:\n🍳 Chef AI: Gợi ý món ăn thông minh.\n📺 Youtube Smart Analyzer: Tóm tắt video siêu tốc.\n📖 3D Chronicles: Hành trình sự nghiệp rực rỡ của ngài.\n\nChúc ngài một ngày làm việc hiệu quả và luôn đủ nước! 💧`);
          await docSnap.ref.update({ intro_sent: true });
          updated = true;
        }
      }

      // 2. Check for Water Reminders
      if (session.schedule && Array.isArray(session.schedule)) {
        const newSchedule = [...session.schedule];
        let foundMatch = false;

        for (const item of newSchedule) {
          if (item.status === 'pending' && item.time === currentTimeStr) {
            console.log(`Triggering Reminder for ${chatId} at ${item.time}`);
            await reply(chatId, `💧 ĐẾN GIỜ UỐNG NƯỚC RỒI NGÀI ${session.name.toUpperCase()} ƠI!\n\nMốc: ${item.time}\nLượng: ${item.amount}\nGhi chú: ${item.note}\n\nUống xong ngài hãy nhắn "Ok" hoặc "Xong" để em ghi nhận nhé! 🫡`);
            item.status = 'sent';
            foundMatch = true;
          }
        }

        if (foundMatch) {
          await docSnap.ref.update({ schedule: newSchedule });
          updated = true;
        }
      }
    }

    return res.status(200).json({ ok: true, processed: sessionsSnap.size });
  } catch (error) {
    console.error("Cron Handler Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
