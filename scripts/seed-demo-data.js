/**
 * Seed deterministic MAISON customers and orders for admin analytics.
 * Safe to run repeatedly: customers are keyed by email and orders by
 * merchantOrderNo. Existing non-demo records are never deleted or overwritten.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const DAY_MS = 24 * 60 * 60 * 1000;
const CUSTOMERS = [
  [
    'An Nguyen',
    'demo.an@maison.test',
    420,
    '0901001001',
    'Ho Chi Minh City',
    'VN',
  ],
  ['Linh Tran', 'demo.linh@maison.test', 310, '0901001002', 'Da Nang', 'VN'],
  ['Minh Le', 'demo.minh@maison.test', 280, '0901001003', 'Ha Noi', 'VN'],
  [
    'Sofia Rossi',
    'demo.sofia@maison.test',
    250,
    '+390201001004',
    'Milan',
    'IT',
  ],
  [
    'Amelia Chen',
    'demo.amelia@maison.test',
    220,
    '+1415001005',
    'San Francisco',
    'US',
  ],
  ['Yuki Tanaka', 'demo.yuki@maison.test', 190, '+813001006', 'Tokyo', 'JP'],
  [
    'Noah Williams',
    'demo.noah@maison.test',
    500,
    '+4420001007',
    'London',
    'UK',
  ],
  ['Mai Pham', 'demo.mai@maison.test', 12, '0901001008', 'Can Tho', 'VN'],
];
const ORDER_DAYS_AGO = [
  2, 4, 7, 10, 14, 18, 23, 28, 34, 41, 49, 57, 66, 74, 83, 92, 103, 114, 126,
  138, 151, 164, 178, 192, 207, 222, 238, 254, 271, 288, 306, 324, 343,
];
const STATUSES = [
  'completed',
  'completed',
  'shipped',
  'paid',
  'pending',
  'completed',
  'cancelled',
];

function resolveUri() {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const match = /^\s*MONGODB_URI\s*=\s*(.*)\s*$/.exec(line);
      if (match) return match[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('Không tìm thấy MONGODB_URI (env hoặc .env)');
}

function dateDaysAgo(now, days, hour = 10) {
  const date = new Date(now.getTime() - days * DAY_MS);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

async function seedCustomers(db, now) {
  const users = db.collection('users');
  const password = await bcrypt.hash('Maison123!', 10);
  const seeded = [];

  for (const [name, email, createdDaysAgo, phone, city, country] of CUSTOMERS) {
    const createdAt = dateDaysAgo(now, createdDaysAgo, 8);
    await users.findOneAndUpdate(
      { email },
      {
        $set: {
          name,
          email,
          role: 'user',
          isVerified: true,
          profile: {
            phone,
            address: { city, country, line1: 'MAISON demo address' },
          },
          updatedAt: now,
        },
        $setOnInsert: { password, refreshTokens: [], createdAt },
      },
      { upsert: true },
    );
    const user = await users.findOne({ email });
    seeded.push({ ...user, createdDaysAgo });
  }

  return seeded;
}

async function seedOrders(db, customers, now) {
  const products = await db
    .collection('products')
    .find()
    .sort({ slug: 1 })
    .toArray();
  if (!products.length) {
    throw new Error('Chưa có products. Hãy chạy npm run seed:products trước.');
  }

  const orders = db.collection('orders');
  for (let index = 0; index < ORDER_DAYS_AGO.length; index += 1) {
    const daysAgo = ORDER_DAYS_AGO[index];
    const eligibleCustomers = customers.filter(
      (customer) =>
        customer.createdDaysAgo >= daysAgo &&
        customer.email !== 'demo.noah@maison.test',
    );
    const customer = eligibleCustomers[index % eligibleCustomers.length];
    const first = products[(index * 3) % products.length];
    const second = products[(index * 3 + 2) % products.length];
    const firstQuantity = (index % 3) + 1;
    const items = [
      {
        productId: first._id,
        name: first.name,
        price: first.price,
        quantity: firstQuantity,
        subtotal: first.price * firstQuantity,
      },
    ];
    if (index % 4 === 0) {
      items.push({
        productId: second._id,
        name: second.name,
        price: second.price,
        quantity: 1,
        subtotal: second.price,
      });
    }

    const subtotal = items.reduce((total, item) => total + item.subtotal, 0);
    const discount =
      index % 6 === 0 ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
    const merchantOrderNo = 'DEMO-MAISON-' + String(index + 1).padStart(3, '0');
    const createdAt = dateDaysAgo(now, daysAgo, 9 + (index % 8));
    await orders.findOneAndUpdate(
      { merchantOrderNo },
      {
        $set: {
          userId: customer._id,
          items,
          subtotal,
          discount,
          totalPrice: subtotal - discount,
          status: STATUSES[index % STATUSES.length],
          paymentProvider: 'demo',
          merchantOrderNo,
          shippingAddress: [
            customer.profile.address.city,
            customer.profile.address.country,
          ].join(', '),
          createdAt,
          updatedAt: createdAt,
        },
      },
      { upsert: true },
    );
  }
}

async function main() {
  const client = new MongoClient(resolveUri());
  await client.connect();
  try {
    const db = client.db();
    const now = new Date();
    const customers = await seedCustomers(db, now);
    await seedOrders(db, customers, now);
    const [customerCount, orderCount] = await Promise.all([
      db.collection('users').countDocuments({ email: /@maison\.test$/ }),
      db
        .collection('orders')
        .countDocuments({ merchantOrderNo: /^DEMO-MAISON-/ }),
    ]);
    console.log(
      'Seed demo hoàn tất: ' +
        customerCount +
        ' khách hàng, ' +
        orderCount +
        ' đơn hàng trong database ' +
        db.databaseName +
        '.',
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('Seed demo thất bại:', error);
  process.exit(1);
});
