/**
 * Migration: chuyển các field tham chiếu đang lưu dạng chuỗi sang ObjectId.
 *
 * Vì sao cần: các schema trước đây khai báo `@Prop({ type: Types.ObjectId })`
 * (dùng Types thay vì SchemaTypes), khiến Mongoose tạo path kiểu Mixed. Path
 * Mixed không cast, nên giá trị được ghi xuống DB đúng như kiểu truyền vào —
 * chỗ truyền chuỗi thì lưu chuỗi, chỗ truyền ObjectId thì lưu ObjectId. Sau khi
 * sửa schema thành ObjectId thật, mọi query đều cast sang ObjectId, nên các
 * document còn lưu chuỗi sẽ không bao giờ khớp nữa.
 *
 * Script chỉ đụng vào document có giá trị KIỂU CHUỖI và đúng định dạng ObjectId
 * 24 ký tự hex; chuỗi rác được bỏ qua và liệt kê ở cuối để xử lý thủ công.
 *
 * Chạy:  node scripts/migrate-objectid-refs.js          (áp dụng thay đổi)
 *        node scripts/migrate-objectid-refs.js --dry-run (chỉ xem trước)
 */
const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const DRY_RUN = process.argv.includes('--dry-run');

/** Đọc MONGODB_URI từ môi trường, không có thì lấy trong .env. */
function resolveUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = /^\s*MONGODB_URI\s*=\s*(.*)\s*$/.exec(line);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('Không tìm thấy MONGODB_URI (env hoặc .env)');
}

const isHexId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

/**
 * Các field cần chuyển. `array` = field nằm trong phần tử của một mảng,
 * `nested` = field nằm trong một object con.
 */
const TARGETS = [
  { collection: 'carts', field: 'userId' },
  { collection: 'carts', field: 'items.productId', array: 'items' },
  { collection: 'orders', field: 'userId' },
  { collection: 'orders', field: 'items.productId', array: 'items' },
  { collection: 'orders', field: 'promotion.promotionId', nested: 'promotion' },
  { collection: 'products', field: 'categoryId' },
];

/** Lấy giá trị theo đường dẫn "a.b" trên một document. */
const get = (doc, dotted) =>
  dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), doc);

async function migrate(db, target) {
  const { collection, field, array, nested } = target;
  const coll = db.collection(collection);
  const docs = await coll.find({}).toArray();

  let converted = 0;
  const skipped = [];

  for (const doc of docs) {
    const update = {};

    if (array) {
      // Ghi lại cả mảng: từng phần tử có thể lẫn chuỗi và ObjectId.
      const key = field.slice(array.length + 1);
      const items = doc[array];
      if (!Array.isArray(items)) continue;
      let touched = false;
      const next = items.map((item) => {
        const value = item?.[key];
        if (!isHexId(value)) {
          if (typeof value === 'string') skipped.push({ _id: doc._id, value });
          return item;
        }
        touched = true;
        return { ...item, [key]: new ObjectId(value) };
      });
      if (touched) {
        update[array] = next;
        converted += 1;
      }
    } else {
      const value = nested ? get(doc, field) : doc[field];
      if (!isHexId(value)) {
        if (typeof value === 'string') skipped.push({ _id: doc._id, value });
        continue;
      }
      update[field] = new ObjectId(value);
      converted += 1;
    }

    if (Object.keys(update).length && !DRY_RUN) {
      await coll.updateOne({ _id: doc._id }, { $set: update });
    }
  }

  const label = `${collection}.${field}`.padEnd(28);
  console.log(
    `  ${label} ${String(converted).padStart(4)} document đã chuyển` +
      (skipped.length ? `  (bỏ qua ${skipped.length} giá trị không hợp lệ)` : ''),
  );
  skipped.forEach((s) =>
    console.log(`      ! _id=${s._id} giá trị không phải ObjectId: ${s.value}`),
  );
  return converted;
}

(async () => {
  const uri = resolveUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  console.log(
    `\nMigrate ObjectId refs — ${db.databaseName}${DRY_RUN ? '  [DRY RUN]' : ''}\n`,
  );

  let total = 0;
  for (const target of TARGETS) {
    total += await migrate(db, target);
  }

  console.log(
    `\nTổng cộng ${total} document ${DRY_RUN ? 'sẽ được' : 'đã được'} cập nhật.\n`,
  );
  await client.close();
})().catch((err) => {
  console.error('Migration thất bại:', err);
  process.exit(1);
});
