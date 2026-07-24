# Hướng Dẫn Deploy Cloudflare Workers & Supabase Edge Functions

Tài liệu này hướng dẫn chi tiết quy trình deploy, thiết lập biến môi trường (Secrets) cho cả hai thành phần Backend của dự án Momento: **Supabase Edge Functions** (phục vụ AI Proxy hội thoại Kaiwa) và **Cloudflare Workers** (phục vụ ký ảnh hoặc các proxy phụ trợ).

---

## Phần 1: Deploy Supabase Edge Functions (`momento-ai-proxy`)

Supabase Edge Functions được viết trên nền tảng Deno Deploy. Đây là nơi chứa logic AI Proxy gọi lên Gemini API một cách bảo mật và không bị geo-block (do IP của Edge Functions nằm ở các khu vực Google hỗ trợ như Singapore).

### Bước 1: Đăng nhập vào Supabase CLI
Chạy lệnh sau tại thư mục gốc dự án để kết nối CLI với tài khoản Supabase của bạn:
```bash
npx supabase login
```
*Hệ thống sẽ hiển thị một mã token verification, nhấn Enter để mở trình duyệt đăng nhập hoặc dán token thủ công.*

### Bước 2: Thiết lập Gemini API Key (Secret)
Không được lưu API Key trực tiếp trong code hoặc client. Hãy đẩy khóa này vào biến môi trường bí mật của Supabase:
```bash
npx supabase secrets set GEMINI_API_KEY="KEY_CỦA_BẠN_Ở_ĐÂY"
```
*Chọn project của bạn khi CLI yêu cầu (ví dụ: `uicwklmejfnsparzvurk`).*

### Bước 3: Deploy Function lên Server
Chạy lệnh sau để đóng gói và đưa function lên Cloud:
```bash
npx supabase functions deploy momento-ai-proxy
```
*Quá trình này sẽ build mã nguồn của function và đẩy trực tiếp lên Supabase project.*

### Bước 4: Xem Logs thời gian thực (Nếu cần debug)
Để theo dõi các lỗi hoặc kiểm tra dữ liệu đi qua Edge Function:
```bash
npx supabase functions logs momento-ai-proxy --follow
```

---

## Phần 2: Deploy Cloudflare Workers (`momento-image-signer` hoặc `momento-ai-proxy-cf`)

Cloudflare Workers chạy trực tiếp trên hệ thống mạng Edge toàn cầu của Cloudflare thông qua Wrangler CLI.

### Bước 1: Đăng nhập vào Cloudflare Wrangler
```bash
npx wrangler login
```
*Lệnh này sẽ tự động mở trình duyệt để bạn xác thực tài khoản Cloudflare.*

### Bước 2: Cập nhật cấu hình biến số
Mở file cấu hình tương ứng của worker (Ví dụ: `worker/momento-ai-proxy/wrangler.jsonc` hoặc `worker/momento-image-signer/wrangler.jsonc`) và cập nhật các biến trong thẻ `"vars"`:
```jsonc
"vars": {
  "SUPABASE_URL": "https://your-project.supabase.co",
  "SUPABASE_ANON_KEY": "YOUR_ANON_KEY",
  "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY" // (Nên cấu hình dạng secret bằng lệnh put nếu deploy bản production)
}
```
> **Mẹo bảo mật**: Bạn nên chuyển sang dùng Secret trên Cloudflare bằng cách chạy:
> `npx wrangler secret put GEMINI_API_KEY` bên trong thư mục chứa worker.

### Bước 3: Triển khai (Deploy)
Di chuyển vào thư mục của worker và chạy lệnh deploy:
```bash
cd worker/momento-ai-proxy
npm install --legacy-peer-deps
npm run deploy
```
*Hoặc chạy trực tiếp `npx wrangler deploy`.*

### Bước 4: Xem logs từ Cloudflare
Để xem trực tiếp các request đang chạy qua Cloudflare Worker:
```bash
npx wrangler tail
```

---

## Hướng dẫn cập nhật Endpoint trên Mobile App (Expo)

Mở tệp tin cấu hình môi trường [.env](file:///d:/Personal/projects/Momento/.env) ở thư mục gốc của React Native project:

1. **Với Supabase Edge Functions**: Client SDK (`supabase.functions.invoke`) tự động nhận diện URL của project. Bạn chỉ cần chắc chắn cấu hình đúng:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. **Với Cloudflare Workers**: Cập nhật URL worker tương ứng của bạn:
   ```env
   EXPO_PUBLIC_WORKER_URL=https://momento-image-signer.your-subdomain.workers.dev
   ```
