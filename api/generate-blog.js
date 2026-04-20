import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (e) {
    console.error("Firebase Admin Init Error:", e);
  }
}

const db = admin.firestore();

export default async function handler(req, res) {
  // Authorization check for Cron (Vercel standard)
  /*
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  */

  try {
    console.log("--- BLOG GENERATION STARTED ---");
    
    // 1. Fetch Gemini Key from Config
    const configSnap = await db.collection('system').doc('config').get();
    if (!configSnap.exists()) throw new Error("System config not found");
    const config = configSnap.data();
    const geminiKey = config?.integrations?.geminiKey || process.env.GEMINI_API_KEY;

    if (!geminiKey) throw new Error("Gemini API Key missing");

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 2. Generate Trending Topic & Article Content
    const now = new Date();
    const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    
    const prompt = `Bạn là một chuyên gia biên tập nội dung AI và SEO. 
Nhiệm vụ: Tìm kiếm/Xác định 1 chủ đề cực kỳ hấp dẫn về Công nghệ hoặc AI đang hot trong ngày hôm nay (${dateStr}) tại Việt Nam hoặc thế giới.
Sau đó, hãy viết một bài blog chất lượng cao bằng Tiếng Việt.

Yêu cầu định dạng JSON chính xác:
{
  "title": "Tiêu đề bài viết hấp dẫn, chuẩn SEO",
  "category": "Technology/AI/Digital Life",
  "excerpt": "Đoạn mô tả ngắn (150-200 ký tự) tóm tắt nội dung bài viết để kích thích người đọc.",
  "content": "Nội dung bài viết chi tiết định dạng Markdown. Sử dụng H2, H3, bôi đậm, danh sách. Độ dài khoảng 800-1200 từ. Nội dung phải chuyên sâu, có giá trị và tối ưu SEO (từ khóa lặp lại tự nhiên).",
  "imagePrompt": "Mô tả hình ảnh minh họa bằng Tiếng Anh (khoảng 30 từ), phong cách nghệ thuật kỹ thuật số, hiện đại, liên quan đến chủ đề bài viết.",
  "slug": "tieu-de-bai-viet-khong-dau"
}

Lưu ý: Chỉ trả về mã JSON nguyên bản, không thêm lời dẫn.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let jsonContent;
    
    try {
      const text = response.text().replace(/```json|```/gi, '').trim();
      jsonContent = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, response.text());
      throw new Error("Failed to parse AI response into JSON");
    }

    // 3. Generate Thumbnail URL via Pollinations
    const seed = Math.floor(Math.random() * 1000000);
    const encodedImagePrompt = encodeURIComponent(jsonContent.imagePrompt || jsonContent.title);
    const thumbnailUrl = `https://image.pollinations.ai/prompt/${encodedImagePrompt}?width=1280&height=720&nologo=true&seed=${seed}`;

    // 4. Save to Firestore
    const newPost = {
      title: jsonContent.title,
      category: jsonContent.category || "Tech",
      excerpt: jsonContent.excerpt,
      content: jsonContent.content,
      thumbnail: thumbnailUrl,
      date: dateStr,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      author: "IRIS AI Core",
      published: true,
      slug: jsonContent.slug || jsonContent.title.toLowerCase().replace(/ /g, '-')
    };

    const docRef = await db.collection('blog_posts').add(newPost);

    console.log(`--- BLOG GENERATION SUCCESS: ${docRef.id} ---`);
    
    return res.status(200).json({ 
      success: true, 
      id: docRef.id,
      title: newPost.title 
    });

  } catch (error) {
    console.error("Blog Generation Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
