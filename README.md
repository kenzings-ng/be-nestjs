# 🛒 E-commerce Backend

REST API cho ứng dụng thương mại điện tử, xây dựng bằng **NestJS 11 + MongoDB (Mongoose)**.
Bao gồm xác thực JWT, quản lý sản phẩm/danh mục/thương hiệu, giỏ hàng, đặt hàng, hồ sơ người dùng và upload ảnh. Tài liệu API tương tác qua **Swagger**.

---

## 1. Yêu cầu môi trường

| Công cụ | Phiên bản khuyến nghị  |
| ------- | ---------------------- |
| Node.js | ≥ 18                   |
| npm     | ≥ 9                    |
| MongoDB | ≥ 6 (local hoặc Atlas) |

Kiểm tra nhanh:

```bash
node -v
npm -v
```

---

## 2. Cài đặt

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env từ mẫu
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
```

Sau đó mở `.env` và điền giá trị thật (xem mục dưới).

---

## 3. Cấu hình `.env`

| Biến                                            | Bắt buộc | Mô tả                                                                                                                                    |
| ----------------------------------------------- | :------: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                                   |    ✅    | Chuỗi kết nối MongoDB, vd `mongodb://localhost:27017/ecommerce`                                                                          |
| `JWT_ACCESS_SECRET`                             |    ✅    | Secret ký access token                                                                                                                   |
| `JWT_REFRESH_SECRET`                            |    ✅    | Secret ký refresh token (khác access)                                                                                                    |
| `JWT_ACCESS_EXPIRES_IN`                         |          | Hạn access token (mặc định `15m`)                                                                                                        |
| `JWT_REFRESH_EXPIRES_IN`                        |          | Hạn refresh token (mặc định `7d`)                                                                                                        |
| `JWT_REFRESH_REMEMBER_EXPIRES_IN`               |          | Hạn refresh khi "remember me" (mặc định `30d`)                                                                                           |
| `PORT`                                          |          | Cổng chạy app (mặc định `3000`)                                                                                                          |
| `APP_URL`                                       |          | URL backend, dùng trong email verify/reset và webhook payment. Khi dùng ComesH phải là URL HTTPS public, ví dụ `https://api.example.com` |
| `FRONTEND_URL`                                  |          | URL frontend                                                                                                                             |
| `PAYMENT_ENVIRONMENT`                           |          | `sandbox` (mặc định) hoặc `production`; checkout chỉ hiển thị credential active thuộc environment này                                    |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` |          | Tài khoản admin được seed tự động khi khởi động                                                                                          |
| `SMTP_*`, `MAIL_FROM`                           |          | Cấu hình gửi mail. **Để trống `SMTP_HOST` ở môi trường dev** → link verify/reset sẽ được in ra console thay vì gửi email                 |

Sinh secret ngẫu nhiên mạnh:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 4. Chạy project

```bash
# Dev (tự reload khi đổi code) — khuyên dùng khi phát triển
npm run start:dev

# Chạy thường
npm run start

# Production (cần build trước)
npm run build
npm run start:prod
```

Mặc định app chạy tại **http://localhost:3000**.

> **Tài khoản admin**: khi khởi động lần đầu, hệ thống tự tạo admin từ `ADMIN_EMAIL` / `ADMIN_PASSWORD` (tài khoản này đã được xác thực sẵn, đăng nhập dùng được ngay).

---

## 5. Tài liệu API (Swagger)

Sau khi chạy app, mở:

```
http://localhost:3000/docs
```

Cách test endpoint cần đăng nhập:

1. Gọi `POST /auth/login` để lấy `accessToken`.
2. Bấm nút **Authorize** (góc phải trên), dán token vào → mọi request có ổ khóa sẽ tự gắn header `Authorization: Bearer <token>`.
3. Bấm **Try it out** trên endpoint để gọi thử.

Token được lưu lại kể cả khi refresh trang.

---

## 6. Tổng quan các module

| Nhóm                    | Prefix                      | Ghi chú                                                                                                                                                     |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth**                | `/auth`                     | Đăng ký, đăng nhập, refresh, logout, verify email, quên/đặt lại mật khẩu                                                                                    |
| **Users**               | `/users`                    | Hồ sơ cá nhân (`/users/me`); admin xem danh sách user                                                                                                       |
| **Products**            | `/products`                 | Duyệt công khai; tạo/sửa/xóa cần quyền admin. Định danh bằng **slug** (`/products/ao-thun-nam`), lọc theo danh mục qua `/products/category/<category-slug>` |
| **Categories**          | `/categories`               | Danh mục sản phẩm, định danh bằng **slug**                                                                                                                  |
| **Brands**              | `/brands`                   | Thương hiệu, định danh bằng **slug**                                                                                                                        |
| **Carts**               | `/carts`                    | Giỏ hàng theo user (thêm/sửa/xóa item)                                                                                                                      |
| **Promotions**          | `/promotions`               | Mã giảm giá: admin CRUD; user xem mã đang chạy (`/promotions/active`) và thử mã trên giỏ (`/promotions/apply`)                                              |
| **Orders**              | `/orders`                   | Đặt hàng từ giỏ (`/orders/checkout`, kèm `promotionCode` nếu có), xem/hủy đơn; admin quản lý trạng thái                                                     |
| **Payment credentials** | `/payment-credentials`      | Admin cấu hình key JSON/capability cho từng cổng; buyer chỉ xem được capability, không có secret                                                            |
| **Payment webhook**     | `/payments/webhooks/comesh` | Callback public từ ComesH, xác minh HMAC raw body và xử lý idempotent                                                                                       |
| **Uploads**             | `/upload/image`             | Upload ảnh (multipart, field `file`); ảnh phục vụ tại `/uploads/<filename>`                                                                                 |

**Phân quyền**: `PUBLIC` (không cần token) · `USER` (cần đăng nhập) · `ADMIN` (token có `role = admin`).

> **Định danh bằng slug**: Products / Categories / Brands dùng `slug` trên URL thay cho `_id`
> (thân thiện SEO, không lộ id nội bộ). Khi sửa, slug trên URL là slug **hiện tại** của bản ghi —
> body có thể chứa slug mới. `_id` vẫn là khóa thật trong DB và là thứ cart/order tham chiếu tới.

---

## 7. Chạy test

```bash
npm run test         # unit test
npm run test:e2e     # end-to-end
npm run test:cov     # coverage
```

---

## 8. Lệnh hữu ích khác

```bash
npm run lint         # ESLint + Prettier (tự fix)
npm run format       # Format code bằng Prettier
```

### Script dữ liệu (chạy một lần, sau khi deploy code mới)

```bash
npm run migrate:objectid   # chuyển các field tham chiếu đang lưu dạng chuỗi sang ObjectId
npm run backfill:slugs     # sinh slug cho document còn thiếu (nếu không có sẽ không truy cập được qua API)
```

Cả hai script đều hỗ trợ `--dry-run` để xem trước mà không ghi gì:

```bash
node scripts/migrate-objectid-refs.js --dry-run
node scripts/backfill-slugs.js --dry-run
```

Chạy lại nhiều lần đều an toàn (chỉ đụng vào document thực sự cần sửa). Nếu có nhiều
môi trường (dev/staging/production) thì phải chạy trên **từng** database.

---

## 9. Cấu trúc thư mục

```
src/
├── config/            # Cấu hình (app, database, jwt, mail, admin)
├── modules/
│   ├── auth/          # Xác thực & phân quyền (JWT, guards, strategies)
│   ├── users/         # Người dùng & hồ sơ (profile)
│   ├── products/      # Sản phẩm
│   ├── categories/    # Danh mục
│   ├── brands/        # Thương hiệu
│   ├── carts/         # Giỏ hàng
│   ├── promotions/    # Mã giảm giá
│   ├── orders/        # Đơn hàng
│   ├── uploads/       # Upload ảnh
│   └── mail/          # Gửi email
├── app.module.ts
└── main.ts            # Bootstrap + cấu hình Swagger
```

---

## 10. Thanh toán ComesH v3

`paymentCredentials` là collection cấu hình đa cổng. Mỗi document có:

- `provider`: tên cổng chuẩn hóa, ví dụ `comesh`.
- `keys`: JSON riêng của provider; ComesH cần `app_key`, `app_secret`, `webhook_secret` và có thể có `baseUrl` để override endpoint (API cũng nhận alias `apiKey`, `apiSecret`, `webhookSecret`).
- `paymentMethods`: các cách trả tiền cổng đang mở, ví dụ `card`, `googlepay`, `applepay`.
- `cardBrands`: các mạng thẻ được chấp nhận, ví dụ `visa`, `mastercard`.
- `environment`, `currency`, `isActive` để tách sandbox/production và bật/tắt an toàn.

Secret `keys` dùng `select: false` và không bao giờ được trả về từ API. Endpoint quản trị là `POST|GET|PATCH|DELETE /payment-credentials`; `GET /payment-credentials/available` chỉ trả capability đang bật cho user đã đăng nhập.

API quản trị trả lại `keys` để admin đối chiếu cấu hình; các endpoint checkout/available không trả secret. URL sandbox/production được cấu hình bằng `PAYMENT_SANDBOX_URL` và `PAYMENT_PRODUCTION_URL`; mỗi credential cũng có thể override bằng `keys.baseUrl`. Currency được snapshot trên mỗi `Transaction`, nên việc đổi `currency` trong credential về sau không làm sai currency của refund/đối soát cho payment đã tạo.

Ví dụ tạo cấu hình sandbox (gọi bằng admin token):

```json
POST /payment-credentials
{
  "provider": "comesh",
  "environment": "sandbox",
  "keys": {
    "app_key": "test_api_key",
    "app_secret": "test_api_secret",
    "webhook_secret": "test_webhook_secret",
    "baseUrl": "https://payment-sandbox.comesh.xyz"
  },
  "paymentMethods": ["card"],
  "cardBrands": ["visa", "mastercard"],
  "currency": "USD",
  "isActive": true
}
```

Khi checkout online, gửi object `payment`. Ví dụ dưới dùng hosted checkout (khuyến nghị vì backend không nhận PAN/CVV):

```json
POST /orders/checkout
{
  "payment": {
    "provider": "comesh",
    "environment": "sandbox",
    "paymentMethod": "card",
    "source": { "type": "checkout" },
    "browser": {
      "screenWidth": 1440,
      "screenHeight": 900,
      "timeZoneOffset": -420
    },
    "billingAddress": {
      "name": "John Smith",
      "line1": "100 Main St",
      "city": "Los Angeles",
      "country": "US"
    },
    "locale": "en"
  }
}
```

Response có `payment.nextAction`; frontend redirect đến `redirectUrl` hoặc render `html` theo `nextAction.type`. Sau khi quay về, gọi `POST /orders/:id/payment-status` để đối soát tức thì. Kết quả cuối cùng vẫn được cập nhật bởi webhook `POST /payments/webhooks/comesh`, endpoint này chỉ trả `SUCCESS` khi chữ ký `X-Webhook-Signature` (HMAC của `timestamp.rawBody`) hợp lệ và `eventId` chưa được xử lý.

Admin hoàn tiền toàn phần hoặc một phần qua `POST /orders/:id/refund`, body tùy chọn `{ "amount": 50.00, "reason": "Customer requested refund" }`. Không gửi `amount` để hoàn phần còn lại. Raw card data không được lưu trong Order, Transaction hay PaymentCredential.

> ComesH v3 hiện chỉ tài liệu hóa nguồn `checkout`, `card`, và `token`; adapter chỉ bật luồng method `card` cho ComesH. Có thể lưu `googlepay`/`applepay` trên credential để dùng khi bổ sung adapter tương ứng, nhưng không được gửi chúng như ComesH v3 hỗ trợ.

## 11. Xử lý sự cố

| Triệu chứng                                | Nguyên nhân thường gặp                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| App không khởi động, lỗi kết nối DB        | `MONGODB_URI` sai hoặc MongoDB chưa chạy                                                      |
| Đăng nhập báo _"Please verify your email"_ | Tài khoản chưa verify — dùng link in ở console (dev) hoặc tài khoản admin đã seed             |
| `401 Unauthorized` khi gọi API             | Thiếu/sai header `Authorization: Bearer <token>` hoặc token hết hạn                           |
| `403 Forbidden`                            | Endpoint yêu cầu quyền admin                                                                  |
| `400 Bad Request` khi gửi body             | Có field không hợp lệ hoặc field lạ (API bật `whitelist` — chỉ nhận đúng field đã định nghĩa) |
