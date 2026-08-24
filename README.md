# MAISON E-commerce API

REST API của hệ thống thương mại điện tử MAISON, xây dựng bằng NestJS 11,
MongoDB và Mongoose. Backend cung cấp JWT authentication, catalog, giỏ hàng,
khuyến mãi, đơn hàng, thanh toán, upload ảnh, email và API quản trị.

## Vai trò trong hệ thống

| Thành phần | URL local | Repository |
| --- | --- | --- |
| Backend API | `http://localhost:3000` | Repository này |
| Swagger | `http://localhost:3000/docs` | Được phục vụ bởi backend |
| Guest frontend | `http://localhost:4200` | [guest-fe-angular](https://github.com/kenzings-ng/guest-fe-angular) |
| Admin frontend | `http://localhost:4201` | [admin-fe-angular](https://github.com/kenzings-ng/admin-fe-angular) |

## Yêu cầu môi trường

| Công cụ | Phiên bản |
| --- | --- |
| Node.js | `>=20.19.0`; khuyến nghị Node 22 LTS hoặc mới hơn |
| npm | `>=9` |
| MongoDB | `>=6`, chạy local hoặc dùng MongoDB Atlas |

> `mongoose@9` yêu cầu Node.js `>=20.19.0`. Node 18 không phù hợp với
> dependency hiện tại.

Kiểm tra phiên bản:

```bash
node -v
npm -v
```

## Quick Start

### 1. Chuẩn bị MongoDB

Chọn một trong hai cách:

- **MongoDB local:** khởi động MongoDB và dùng URI dạng
  `mongodb://localhost:27017/nest`.
- **MongoDB Atlas:** tạo database, cho phép IP của máy phát triển và sao chép
  connection string vào `MONGODB_URI`.

Không dùng database production để phát triển hoặc chạy test.

### 2. Clone và cài dependency

```bash
git clone https://github.com/kenzings-ng/be-nestjs.git
cd be-nestjs
npm ci
```

Dùng `npm ci` khi clone mới để cài đúng phiên bản trong `package-lock.json`.

### 3. Tạo file môi trường

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Tạo hai secret khác nhau:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Mở `.env` và thay ít nhất các giá trị sau:

```dotenv
MONGODB_URI=mongodb://localhost:27017/nest

JWT_ACCESS_SECRET=<secret-thứ-nhất>
JWT_REFRESH_SECRET=<secret-thứ-hai>

APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4200

ADMIN_EMAIL=admin@shop.com
ADMIN_PASSWORD=change-me
ADMIN_NAME=Administrator
```

Giữ `MAIL_HOST` trống ở local để link xác minh email và reset password được in
ra console thay vì gửi SMTP.

### 4. Chạy backend

```bash
npm run start:dev
```

Khi terminal báo app đã khởi động:

- API: [http://localhost:3000](http://localhost:3000)
- Swagger: [http://localhost:3000/docs](http://localhost:3000/docs)

Backend tự tạo tài khoản admin từ `ADMIN_EMAIL`, `ADMIN_PASSWORD` và
`ADMIN_NAME` nếu email chưa tồn tại. Tài khoản được xác minh sẵn.

> Đổi các biến admin sau lần seed đầu không tự cập nhật tài khoản đã tồn tại
> trong MongoDB.

### 5. Tạo dữ liệu demo

Mở terminal khác trong repository backend:

```bash
npm run seed:demo
```

Lệnh này seed catalog và dữ liệu demo vào database được chỉ định bởi
`MONGODB_URI`. Có thể chạy lại vì script dùng khóa ổn định và upsert dữ liệu.

### 6. Kiểm tra đăng nhập

Trong Swagger:

1. Gọi `POST /auth/login` bằng tài khoản admin trong `.env`.
2. Sao chép `accessToken` từ response.
3. Chọn **Authorize** và nhập token.
4. Gọi thử endpoint có biểu tượng ổ khóa.

Swagger giữ token khi reload trang.

## Chạy cả hệ thống

Mở ba terminal:

```bash
# Terminal 1 — backend
cd be-nestjs
npm run start:dev
```

```bash
# Terminal 2 — storefront
cd guest-fe-angular
npm run config:runtime
npm start
```

```bash
# Terminal 3 — admin
cd admin-fe-angular
npm run config:runtime
npm start -- --port 4201
```

Thứ tự khuyến nghị: chạy MongoDB → backend → hai frontend.

Hai frontend cần file `.env` với:

```dotenv
API_URL=http://localhost:3000
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
| --- | :---: | --- |
| `MONGODB_URI` | Có | MongoDB connection string. |
| `JWT_ACCESS_SECRET` | Có | Secret ký access token. |
| `JWT_REFRESH_SECRET` | Có | Secret ký refresh token; phải khác access secret. |
| `JWT_ACCESS_EXPIRES_IN` | Không | Hạn access token, mặc định `15m`. |
| `JWT_REFRESH_EXPIRES_IN` | Không | Hạn refresh token, mặc định `7d`. |
| `JWT_REFRESH_REMEMBER_EXPIRES_IN` | Không | Hạn refresh khi remember me, mặc định `30d`. |
| `PORT` | Không | Cổng backend, mặc định `3000`. |
| `APP_URL` | Không | Public backend URL; production payment webhook cần HTTPS public. |
| `FRONTEND_URL` | Không | Storefront URL dùng cho verify/reset/payment return, mặc định `http://localhost:4200`. |
| `ADMIN_EMAIL` | Không | Email admin được seed khi app khởi động. |
| `ADMIN_PASSWORD` | Không | Password admin seed; phải đổi giá trị mẫu. |
| `ADMIN_NAME` | Không | Tên hiển thị của admin seed. |
| `MAIL_HOST` | Không | SMTP host; để trống ở local để log email ra console. |
| `MAIL_PORT` | Không | SMTP port, mặc định `587`. |
| `MAIL_ENCRYPTION` | Không | Bật kết nối SMTP secure khi bằng `true`. |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | Không | SMTP credentials. |
| `MAIL_FROM` | Không | Địa chỉ người gửi. |
| `CONTACT_EMAIL` | Không | Hộp thư nhận contact form; mặc định dùng admin email. |
| `BASE_URL` | Không | Base URL trả về sau upload; mặc định lấy từ request. |
| `PAYMENT_ENVIRONMENT` | Không | `sandbox` hoặc `production`; mặc định `sandbox`. |
| `PAYMENT_SANDBOX_URL` | Không | ComesH sandbox base URL. |
| `PAYMENT_PRODUCTION_URL` | Không | ComesH production base URL. |
| `NODE_ENV` | Không | Khi là `production`, checkout luôn dùng payment production. |

Không commit `.env` hoặc secret thật lên Git.

## Scripts

| Lệnh | Mô tả |
| --- | --- |
| `npm run start:dev` | Chạy development server và tự reload. |
| `npm run start:debug` | Chạy watch mode với Node debugger. |
| `npm run build` | Compile TypeScript vào `dist/`. |
| `npm run start:prod` | Chạy build production từ `dist/main`. |
| `npm run test` | Chạy unit test bằng Jest. |
| `npm run test:e2e` | Chạy end-to-end test; cần database test. |
| `npm run test:cov` | Chạy test và sinh coverage. |
| `npm run lint` | Chạy ESLint và tự sửa lỗi có thể sửa. |
| `npm run format` | Format source/test bằng Prettier. |
| `npm run seed:products` | Upsert danh mục và sản phẩm mẫu. |
| `npm run seed:demo` | Seed products và dữ liệu demo. |
| `npm run migrate:objectid` | Chuyển reference string sang ObjectId. |
| `npm run backfill:slugs` | Sinh slug cho document còn thiếu. |

Chạy migration ở chế độ xem trước:

```bash
npm run migrate:objectid -- --dry-run
npm run backfill:slugs -- --dry-run
```

Luôn backup database quan trọng trước khi chạy migration ghi dữ liệu.

## Tổng quan API

| Nhóm | Prefix | Quyền |
| --- | --- | --- |
| Auth | `/auth` | Public và user |
| Users | `/users` | User và admin |
| Products | `/products` | Public read, admin write |
| Categories | `/categories` | Public read, admin write |
| Brands | `/brands` | Public read, admin write |
| Carts | `/carts` | User |
| Promotions | `/promotions` | Public/user/admin tùy endpoint |
| Orders | `/orders` | User và admin |
| Payment credentials | `/payment-credentials` | User capability, admin management |
| Transactions | `/transactions` | Admin |
| ComesH webhook | `/payments/webhooks/comesh` | Public, xác minh HMAC |
| Contact | `/contact` | Public submit, admin management |
| Uploads | `/upload/image` | Authenticated |

Products, categories và brands dùng slug trên URL. MongoDB `_id` vẫn là khóa
nội bộ được cart/order tham chiếu.

## Cấu trúc dự án

```text
src/
├── common/            # Thành phần dùng chung
├── config/            # App, database, JWT, mail, payment và admin config
├── modules/
│   ├── auth/          # Authentication và authorization
│   ├── users/         # User profile và admin user management
│   ├── products/      # Sản phẩm
│   ├── categories/    # Danh mục
│   ├── brands/        # Thương hiệu
│   ├── carts/         # Giỏ hàng
│   ├── promotions/    # Khuyến mãi
│   ├── orders/        # Đơn hàng
│   ├── payments/      # Credential, gateway và webhook
│   ├── transactions/  # Payment/refund transactions
│   ├── contact/       # Contact form và admin inbox
│   ├── uploads/       # Upload ảnh
│   └── mail/          # SMTP và dev console mail
├── app.module.ts
└── main.ts            # Bootstrap, validation, CORS và Swagger
```

## Thanh toán ComesH v3

Mỗi payment credential gồm:

- `provider`: ví dụ `comesh`.
- `environment`: `sandbox` hoặc `production`.
- `keys`: `app_key`, `app_secret`, `webhook_secret` và tùy chọn
  `baseUrl`.
- `paymentMethods`, `cardBrands`, `currency` và `isActive`.

Ví dụ tạo credential sandbox qua `POST /payment-credentials` bằng admin token:

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

Secret `keys` dùng `select: false`. Response create/update và endpoint
`/payment-credentials/available` không trả secret.

Checkout online trả `payment.nextAction`; frontend redirect hoặc render theo
`nextAction.type`. Sau khi quay lại storefront, gọi
`POST /orders/:id/payment-status` để đối soát. Webhook cuối cùng đi vào
`POST /payments/webhooks/comesh` và được xác minh bằng HMAC-SHA256 của
`<timestamp>.<exact-raw-body>`.

Không lưu PAN/CVV trong Order, Transaction hoặc PaymentCredential. Chỉ bật
production sau khi có live credential, webhook secret và public HTTPS
`APP_URL`.

## Xử lý sự cố

| Triệu chứng | Cách kiểm tra |
| --- | --- |
| Không kết nối được database | Kiểm tra MongoDB đang chạy, `MONGODB_URI`, Atlas IP allowlist và password encoding. |
| `EADDRINUSE: 3000` | Dừng process đang dùng cổng hoặc đổi `PORT`. |
| `Unsupported engine` khi cài package | Dùng Node.js `>=20.19.0`. |
| Đăng nhập báo chưa xác minh email | Mở link trong email hoặc console backend khi `MAIL_HOST` trống. |
| `401 Unauthorized` | Kiểm tra bearer token và thời hạn token. |
| `403 Forbidden` | Endpoint yêu cầu role admin. |
| `400 Bad Request` với field lạ | API bật whitelist và từ chối field không có trong DTO. |
| Không thấy dữ liệu storefront | Chạy `npm run seed:demo` trên đúng database. |
| Không có phương thức thanh toán | Chưa có credential active đúng payment environment/method. |
| Webhook ComesH thất bại | Kiểm tra public HTTPS `APP_URL`, timestamp, raw body và webhook secret. |

## Nguyên tắc bảo mật

- Không commit `.env`, database URI có credential, JWT secret hoặc payment key.
- Dùng database riêng cho development/test/production.
- Đổi admin password mẫu trước khi chia sẻ hoặc deploy.
- Không đưa production payment credential vào môi trường local.
