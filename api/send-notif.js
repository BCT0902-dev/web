export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { chat_id, text } = req.body;

  if (!chat_id || !text) {
    return res.status(400).json({ error: 'Missing chat_id or text' });
  }

  const BOT_TOKEN = process.env.ZALO_BOT_TOKEN;

  if (!BOT_TOKEN) {
    console.error("CRITICAL: ZALO_BOT_TOKEN is not set on server!");
    return res.status(500).json({ 
      error: 'Cấu hình Server thiếu ZALO_BOT_TOKEN. Vui lòng thêm vào biến môi trường Vercel.',
      ok: false 
    });
  }

  try {
    const response = await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text })
    });

    const data = await response.json();
    console.log("Zalo API Proxy Result:", JSON.stringify(data));
    
    if (!data.ok) {
      console.error("Zalo API Error Detail:", data.description || "Unknown error");
    }

    return res.status(data.ok ? 200 : 400).json(data);
  } catch (error) {
    console.error("Zalo Proxy Error:", error);
    return res.status(500).json({ error: 'Failed to connect to Zalo API Bridge', ok: false });
  }
}
