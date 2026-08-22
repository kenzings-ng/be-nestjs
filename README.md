# 🛒 E-commerce Backend

REST API cho ứng dụng thương mại điện tử, xây dựng bằng **NestJS 11 + MongoDB (Mongoose)**.
Bao gồm xác thực JWT, quản lý sản phẩm/danh mục/thương hiệu, giỏ hàng, khuyến mãi,
đặt hàng, thanh toán, hồ sơ người dùng, liên hệ và upload ảnh. Tài liệu API tương
tác qua **Swagger**.

---

## 1. Yêu cầu môi trường

| Công cụ | Phiên bản khuyến nghị                            |
| ------- | ------------------------------------------------ |
| Node.js | ≥ 20.19.0 (khuyến nghị Node 22 LTS hoặc mới hơn) |
| npm     | ≥ 9                                              |
| MongoDB | ≥ 6 (local hoặc Atlas)                           |

> `mongoose@9` trong lockfile yêu cầu Node.js ≥ 20.19.0. Node 18 không cài/chạy
> đúng bộ dependency hiện tại.

Kiểm tra nhanh:

```bash
node -v
npm -v
```

---

## 2. Cài đặt

```bash
# 1. Cài đúng dependency trong package-lock.json (khuyến nghị khi clone mới)
npm ci

# Hoặc dùng npm install nếu đang chủ động cập nhật dependency/lockfile
# npm install

# 2. Tạo file .env từ mẫu
cp .env.example .env       # Windows PowerShell: Copy-Item .env.example .env
```

Sau đó:

1. Đảm bảo MongoDB local đang chạy, hoặc chuẩn bị connection string của MongoDB Atlas.
2. Mở `.env` và điền giá trị thật theo mục dưới.
3. Không commit `.env` hoặc secret thật lên Git.

---

## 3. Cấu hình `.env`

| Biến                                            | Bắt buộc | Mô tả                                                                                                    |
| ----------------------------------------------- | :------: | -------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`                                   |    ✅    | Chuỗi kết nối MongoDB, ví dụ `mongodb://localhost:27017/ecommerce`                                       |
| `JWT_ACCESS_SECRET`                             |    ✅    | Secret ký access token                                                                                   |
| `JWT_REFRESH_SECRET`                            |    ✅    | Secret ký refresh token; phải khác access secret                                                         |
| `JWT_ACCESS_EXPIRES_IN`                         |          | Hạn access token, mặc định `15m`                                                                         |
| `JWT_REFRESH_EXPIRES_IN`                        |          | Hạn refresh token, mặc định `7d`                                                                         |
| `JWT_REFRESH_REMEMBER_EXPIRES_IN`               |          | Hạn refresh khi “remember me”, mặc định `30d`                                                            |
| `PORT`                                          |          | Cổng backend, mặc định `3000`                                                                            |
| `APP_URL`                                       |          | Public URL của backend; dùng tạo callback webhook ComesH. Production phải là HTTPS public                |
| `FRONTEND_URL`                                  |          | URL frontend; dùng tạo link verify/reset email và trang payment return, mặc định `http://localhost:4200` |
| `NODE_ENV`                                      |          | Khi bằng `production`, checkout luôn dùng payment environment `production`                               |
| `PAYMENT_ENVIRONMENT`                           |          | `sandbox` (mặc định) hoặc `production`; chọn credential được dùng ở checkout                             |
| `PAYMENT_SANDBOX_URL`                           |          | Base URL ComesH sandbox, mặc định `https://payment-sandbox.comesh.xyz`                                   |
| `PAYMENT_PRODUCTION_URL`                        |          | Base URL ComesH production, mặc định `https://payment.comesh.xyz`                                        |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` |          | Tài khoản admin được seed ở lần khởi động đầu tiên; nên đặt password mạnh trước lần chạy đầu             |
| `MAIL_HOST`                                     |          | SMTP host. Để trống ở local để email/link được ghi ra console                                            |
| `MAIL_PORT`                                     |          | SMTP port, mặc định `587`                                                                                |
| `MAIL_ENCRYPTION`                               |          | Đặt `true` để bật kết nối SMTP secure; mặc định `false`                                                  |
| `MAIL_USERNAME` / `MAIL_PASSWORD`               |          | Thông tin đăng nhập SMTP                                                                                 |
| `MAIL_FROM`                                     |          | Người gửi email, mặc định `No Reply <no-reply@shop.com>`                                                 |
| `CONTACT_EMAIL`                                 |          | Hộp thư nhận form liên hệ; mặc định dùng `ADMIN_EMAIL`                                                   |
| `BASE_URL`                                      |          | Base URL trả về sau khi upload ảnh; nếu bỏ trống sẽ dùng protocol/host của request                       |

Sinh secret ngẫu nhiên mạnh bằng lệnh dưới. Chạy **hai lần** để lấy hai giá trị
khác nhau cho access và refresh token:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Ở local có thể giữ `MAIL_HOST` trống. Email xác minh, reset password và thông báo
liên hệ sẽ được ghi ra console thay vì gửi qua SMTP.

---

## 4. Chạy project

```bash
# Dev (tự reload khi đổi code) — khuyên dùng khi phát triển
npm run start:dev

# Dev + Node debugger
npm run start:debug

# Chạy thường
npm run start

# Production (cần build trước)
npm run build
npm run start:prod
```

Mặc định app chạy tại **http://localhost:3000**.

> **Tài khoản admin**: khi khởi động, hệ thống tạo admin từ `ADMIN_EMAIL` /
> `ADMIN_PASSWORD` nếu email đó chưa tồn tại. Tài khoản được xác thực sẵn. Thay đổi
> các biến này sau khi admin đã được tạo sẽ không cập nhật tài khoản cũ.

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

| Nhóm                    | Prefix                      | Ghi chú                                                                                                                 |
| ----------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Auth**                | `/auth`                     | Đăng ký, đăng nhập, refresh, logout, verify email, quên/đặt lại mật khẩu và xem JWT identity (`/auth/me`)               |
| **Users**               | `/users`                    | User xem/sửa hồ sơ tại `/users/me`; admin xem danh sách và chi tiết user                                                |
| **Products**            | `/products`                 | Duyệt công khai; tạo/sửa/xóa cần admin. Định danh bằng **slug**; lọc qua `/products/category/<category-slug>`           |
| **Categories**          | `/categories`               | Duyệt công khai; admin CRUD danh mục theo **slug**                                                                      |
| **Brands**              | `/brands`                   | Duyệt công khai; admin CRUD thương hiệu theo **slug**                                                                   |
| **Carts**               | `/carts`                    | Mọi thao tác cần đăng nhập; quản lý giỏ và từng product/variant                                                         |
| **Promotions**          | `/promotions`               | Admin CRUD; `/promotions/active` là public; `/promotions/apply` cần đăng nhập                                           |
| **Orders**              | `/orders`                   | Checkout từ giỏ, xem/hủy đơn, đối soát hoặc retry payment; admin xem tất cả, cập nhật trạng thái và refund              |
| **Payment credentials** | `/payment-credentials`      | Admin quản lý cấu hình cổng; user đăng nhập xem capability an toàn tại `/payment-credentials/available`                 |
| **Transactions**        | `/transactions`             | Admin xem toàn bộ giao dịch payment/refund                                                                              |
| **Payment webhook**     | `/payments/webhooks/comesh` | Callback public từ ComesH; xác minh HMAC trên raw body và xử lý idempotent                                              |
| **Contact**             | `/contact`                  | Public gửi form liên hệ; admin xem danh sách và đánh dấu đã đọc                                                         |
| **Uploads**             | `/upload/image`             | Cần đăng nhập; multipart field `file`, tối đa 5 MB, nhận JPEG/PNG/GIF/WebP; file được phục vụ tại `/uploads/<filename>` |

**Phân quyền**: `PUBLIC` (không cần token) · `USER` (cần đăng nhập) · `ADMIN` (token có `role = admin`).

> **Định danh bằng slug**: Products / Categories / Brands dùng `slug` trên URL thay cho `_id`
> (thân thiện SEO, không lộ id nội bộ). Khi sửa, slug trên URL là slug **hiện tại** của bản ghi —
> body có thể chứa slug mới. `_id` vẫn là khóa thật trong DB và là thứ cart/order tham chiếu tới.

---

## 7. Chạy test

```bash
npm run test         # unit test
npm run test:watch   # unit test ở chế độ watch
npm run test:e2e     # end-to-end
npm run test:cov     # coverage
```

E2E khởi tạo `AppModule`, vì vậy cần cấu hình `MONGODB_URI` tới database test
đang chạy. Không dùng database production cho test.

---

## 8. Lệnh hữu ích khác

```bash
npm run lint         # ESLint + Prettier (tự fix)
npm run format       # Format code bằng Prettier
```

### Script dữ liệu

```bash
npm run migrate:objectid   # chuyển các field tham chiếu đang lưu dạng chuỗi sang ObjectId
npm run backfill:slugs     # sinh slug cho document còn thiếu (nếu không có sẽ không truy cập được qua API)
npm run seed:products      # upsert danh mục và sản phẩm mẫu cho storefront
```

Hai script migration hỗ trợ `--dry-run` để xem trước mà không ghi dữ liệu:

```bash
npm run migrate:objectid -- --dry-run
npm run backfill:slugs -- --dry-run
```

Các migration chỉ sửa document cần chuyển đổi; seed dùng slug làm khóa và upsert,
nên có thể chạy lại mà không tạo bản ghi trùng. Tất cả script đọc `MONGODB_URI` từ
environment hoặc `.env`. Nếu có nhiều môi trường thì phải chạy trên **từng**
database, và nên chạy `--dry-run` trước với dữ liệu quan trọng.

---

## 9. Cấu trúc thư mục

```
src/
├── common/            # Thành phần dùng chung
├── config/            # Cấu hình app, database, JWT, mail, payment, admin
├── modules/
│   ├── auth/          # Xác thực & phân quyền (JWT, guards, strategies)
│   ├── users/         # Người dùng & hồ sơ (profile)
│   ├── products/      # Sản phẩm
│   ├── categories/    # Danh mục
│   ├── brands/        # Thương hiệu
│   ├── carts/         # Giỏ hàng
│   ├── promotions/    # Mã giảm giá
│   ├── orders/        # Đơn hàng
│   ├── payments/      # Credential, gateway ComesH và webhook idempotency
│   ├── transactions/  # Giao dịch payment/refund
│   ├── contact/       # Form liên hệ và inbox admin
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

Secret `keys` dùng `select: false`, nên không xuất hiện trong query thông thường.
API quản trị gồm `POST /payment-credentials`, `GET /payment-credentials`,
`GET /payment-credentials/:id`, `PATCH /payment-credentials/:id` và
`DELETE /payment-credentials/:id`. Chỉ hai endpoint admin `GET` chủ động trả
`keys` để đối chiếu; response create/update và
`GET /payment-credentials/available` không trả secret. Endpoint `available` cần
đăng nhập và chỉ trả capability đang bật trong environment checkout hiện tại.

URL sandbox/production lấy từ `PAYMENT_SANDBOX_URL` và
`PAYMENT_PRODUCTION_URL`; từng credential có thể override bằng `keys.baseUrl`.
Khi `NODE_ENV=production`, checkout luôn chọn environment `production`; nếu
không thì dùng `PAYMENT_ENVIRONMENT` và mặc định là `sandbox`. Currency được
snapshot trên mỗi `Transaction`, nên đổi currency của credential về sau không
làm sai currency của refund/đối soát payment đã tạo.

Ví dụ tạo cấu hình sandbox (gọi `POST /payment-credentials` bằng admin token):

```json
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

Khi checkout online, gửi object `payment`. Ví dụ dưới gọi
`POST /orders/checkout` và dùng hosted checkout (khuyến nghị vì request này
không gửi PAN/CVV qua backend):

```json
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

Response có `payment.nextAction`; frontend redirect đến `redirectUrl` hoặc render
`html` theo `nextAction.type`. Sau khi quay về, gọi
`POST /orders/:id/payment-status` để đối soát tức thì. Có thể retry payment qua
`POST /orders/:id/payment-retry` khi phù hợp.

Kết quả cuối cùng vẫn được cập nhật bởi webhook
`POST /payments/webhooks/comesh`. ComesH phải gửi `X-Webhook-Timestamp` và
`X-Webhook-Signature`; chữ ký là HMAC-SHA256 của
`<timestamp>.<exact-raw-body>`. Endpoint trả plain text `SUCCESS` sau khi xác
thực và xử lý thành công. `eventId` trùng được xác nhận idempotent bằng
`SUCCESS`; lỗi xử lý sẽ giải phóng claim để provider có thể retry.

Admin hoàn tiền toàn phần hoặc một phần qua `POST /orders/:id/refund`, body tùy
chọn `{ "amount": 50.00, "reason": "Customer requested refund" }`. Không gửi
`amount` để hoàn phần còn lại. Raw card data của source `card` chỉ được chuyển
tiếp tới gateway và không được lưu trong Order, Transaction hay
PaymentCredential.

> ComesH v3 hiện chỉ tài liệu hóa nguồn `checkout`, `card`, và `token`; adapter chỉ bật luồng method `card` cho ComesH. Có thể lưu `googlepay`/`applepay` trên credential để dùng khi bổ sung adapter tương ứng, nhưng không được gửi chúng như ComesH v3 hỗ trợ.

## 11. Xử lý sự cố

| Triệu chứng                                | Nguyên nhân thường gặp                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| App không khởi động, lỗi kết nối DB        | `MONGODB_URI` sai hoặc MongoDB chưa chạy                                                      |
| Đăng nhập báo _"Please verify your email"_ | Tài khoản chưa verify — dùng link in ở console (dev) hoặc tài khoản admin đã seed             |
| `401 Unauthorized` khi gọi API             | Thiếu/sai header `Authorization: Bearer <token>` hoặc token hết hạn                           |
| `403 Forbidden`                            | Endpoint yêu cầu quyền admin                                                                  |
| `400 Bad Request` khi gửi body             | Có field không hợp lệ hoặc field lạ (API bật `whitelist` — chỉ nhận đúng field đã định nghĩa) |
| `npm` báo `Unsupported engine`             | Node.js quá cũ; dùng Node ≥ 20.19.0                                                           |
| Không nhận được email ở local              | `MAIL_HOST` đang để trống; kiểm tra link/nội dung mail trong console                          |
| Checkout online không thấy cổng thanh toán | Chưa có credential active đúng `PAYMENT_ENVIRONMENT`, hoặc method chưa được bật               |
| ComesH không gọi được webhook              | `APP_URL` chưa phải HTTPS public hoặc credential/webhook secret không đúng                    |
