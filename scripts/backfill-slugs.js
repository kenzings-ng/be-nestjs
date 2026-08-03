/**
 * Backfill slug cho các document còn thiếu.
 *
 * Vì sao cần: từ khi mọi route định danh bản ghi bằng `slug` thay cho `_id`,
 * document không có slug sẽ không thể truy cập qua API (không xem, sửa hay xóa
 * được). Schema có khai báo `required: true` nhưng dữ liệu tạo trước đó — hoặc
 * ghi thẳng vào DB — vẫn có thể thiếu.
 *
 * Slug được sinh từ `name`/`title`, bỏ dấu tiếng Việt, và tự thêm hậu tố -2, -3
 * nếu trùng. Document đã có slug thì không đụng tới.
 *
 * Chạy:  node scripts/backfill-slugs.js            (áp dụng thay đổi)
 *        node scripts/backfill-slugs.js --dry-run  (chỉ xem trước)
 */
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

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

/** "Áo Thun Nam" -> "ao-thun-nam" */
function slugify(input) {
  return String(input ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // bỏ dấu tổ hợp sau khi NFD
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Nguồn để sinh slug, theo thứ tự ưu tiên, cho từng collection. */
const COLLECTIONS = [
  { name: 'products', from: ['name', 'title'] },
  { name: 'categories', from: ['title', 'name'] },
  { name: 'brands', from: ['name', 'title'] },
];

async function backfill(db, { name: collName, from }) {
  const coll = db.collection(collName);
  const docs = await coll.find({}).toArray();

  // Slug đang được dùng — dùng để tránh trùng, kể cả trùng với doc mới sinh.
  const taken = new Set(
    docs.map((d) => d.slug).filter((s) => typeof s === 'string' && s),
  );
  const missing = docs.filter(
    (d) => typeof d.slug !== 'string' || d.slug.trim() === '',
  );

  console.log(
    `-- ${collName}: ${docs.length} document, ${missing.length} thiếu slug`,
  );

  for (const doc of missing) {
    const source = from.map((f) => doc[f]).find((v) => v);
    let base = slugify(source);
    if (!base) base = String(doc._id); // không có tên -> dùng _id làm slug

    let slug = base;
    for (let i = 2; taken.has(slug); i += 1) slug = `${base}-${i}`;
    taken.add(slug);

    console.log(`   _id=${doc._id}  "${source ?? '(không tên)'}" -> ${slug}`);
    if (!DRY_RUN) {
      await coll.updateOne({ _id: doc._id }, { $set: { slug } });
    }
  }
  return missing.length;
}

(async () => {
  const uri = resolveUri();
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  console.log(
    `\nBackfill slug — ${db.databaseName}${DRY_RUN ? '  [DRY RUN]' : ''}\n`,
  );

  let total = 0;
  for (const target of COLLECTIONS) {
    total += await backfill(db, target);
  }

  console.log(
    `\nTổng cộng ${total} document ${DRY_RUN ? 'sẽ được' : 'đã được'} gán slug.\n`,
  );
  await client.close();
})().catch((err) => {
  console.error('Backfill thất bại:', err);
  process.exit(1);
});
