# IRIS Ecosystem / BCT0902 Core Console

![IRIS Ecosystem](public/logobct.png)

Chào mừng đến với **IRIS Ecosystem** (hay còn gọi là Hệ sinh thái BCT0902) – một nền tảng đa dụng kết hợp giao diện **Cyber-Glassmorphism** tối tân cùng với kiến trúc serverless mạnh mẽ. 

Hệ thống được thiết kế theo triết lý "High-Depth, Premium Finishes", mang đến trải nghiệm thị giác tuyệt vời kết hợp với hiệu suất mượt mà cho cả người dùng cuối và quản trị viên.

## 🌟 Tính năng Nổi bật

*   **Cyber-Glassmorphism UI:** Trải nghiệm thiết kế cao cấp với hiệu ứng kính mờ (backdrop-blur), ánh sáng viền (border-glow), và tông màu Neon hiện đại.
*   **Admin Dashboard Toàn diện:** 
    *   Quản lý cấu hình động (General, Appearance, Content).
    *   Quản lý dự án / phần mềm với bộ đếm lượt tải.
    *   Quản lý bài viết (Blog CMS).
    *   Thống kê truy cập (Analytics) thời gian thực.
    *   Hệ thống khóa bảo trì (Maintenance Mode).
*   **Trình Rút Gọn Liên Kết (Link Shortener):** Tạo URL ngắn tùy chỉnh, tạo mã QR Code động, và theo dõi lượng click.
*   **Hệ thống Thi Trắc Nghiệm (Quiz Maker & Player):** Cho phép tạo đề thi cấu trúc JSON, chạy bài kiểm tra với đồng hồ đếm ngược và hiệu ứng đồ họa bắt mắt.
*   **Tích hợp AI & Dịch vụ:** Chuẩn bị sẵn sàng cho các kết nối API từ Gemini, Groq, và các AI model khác.
*   **Authentication & Security:** Quản lý đăng nhập/đăng xuất bằng Firebase Auth với phân quyền Quản trị (Admin) và Người dùng.

## 🛠 Tech Stack (Công nghệ sử dụng)

*   **Frontend Core:** React, Vite (ESBuild siêu tốc).
*   **Animation & UI:** Framer Motion, Lucide-react (Icons).
*   **Styling:** Vanilla CSS kết hợp các biến màu sắc (CSS Variables) chuẩn Cyberpunk.
*   **Backend & Database:** Firebase (Firestore DB, Authentication).
*   **Tiện ích:** `qrcode.react`, `react-router-dom`, `react-i18next` (Đa ngôn ngữ).

## 🚀 Hướng dẫn Cài đặt & Chạy cục bộ

### Yêu cầu hệ thống:
*   Node.js (phiên bản 18+ khuyến nghị)
*   NPM hoặc Yarn

### Các bước cài đặt:

1. **Clone repository:**
   ```bash
   git clone https://github.com/BCT0902-dev/web_bct0902.top.git
   cd web_bct0902.top
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Thiết lập biến môi trường:**
   Tạo file `.env` tại thư mục gốc và cung cấp các cấu hình Firebase của bạn:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Khởi chạy máy chủ phát triển (Dev Server):**
   ```bash
   npm run dev
   ```
   *Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173`*

5. **Build cho môi trường Production:**
   ```bash
   npm run build
   ```

## 🔒 Quy trình "Verify-Before-Report"

Dự án này tuân thủ nghiêm ngặt giao thức **Verify-Before-Report**:
*   Mọi thay đổi trong cấu trúc thẻ JSX phải được kiểm tra tính toàn vẹn (cân bằng thẻ đóng/mở).
*   Bắt buộc chạy `npm run build` thành công (`exit code 0`) trước khi đẩy mã nguồn lên nhánh chính (`main`).
*   Không push code lỗi hoặc code gây phá vỡ giao diện (UI Breakage).

## 🤝 Tác giả & Bản quyền
Phát triển bởi **BCT0902-dev**.
Hệ thống lõi **Core Console v2.0**.
