import {
  buildCustomerSummaries,
  buildDashboardOverview,
} from './admin-analytics.mapper';

const now = new Date('2026-08-23T00:00:00.000Z');

const users = [
  {
    _id: 'user-1',
    name: 'An Nguyen',
    email: 'an@maison.test',
    role: 'user',
    createdAt: new Date('2026-01-10T00:00:00.000Z'),
    profile: { address: { city: 'Ho Chi Minh City', country: 'VN' } },
  },
  {
    _id: 'user-2',
    name: 'Linh Tran',
    email: 'linh@maison.test',
    role: 'user',
    createdAt: new Date('2026-08-10T00:00:00.000Z'),
    profile: { address: { city: 'Da Nang', country: 'VN' } },
  },
];

const products = [
  { _id: 'product-1', name: 'The Wool Overcoat', categoryId: 'category-1' },
];

const categories = [{ _id: 'category-1', title: 'Outerwear' }];

const orders = [
  {
    _id: 'order-current-completed',
    userId: 'user-1',
    status: 'completed',
    totalPrice: 200,
    createdAt: new Date('2026-08-20T00:00:00.000Z'),
    items: [
      {
        productId: 'product-1',
        name: 'The Wool Overcoat',
        quantity: 2,
        subtotal: 200,
      },
    ],
  },
  {
    _id: 'order-current-cancelled',
    userId: 'user-1',
    status: 'cancelled',
    totalPrice: 300,
    createdAt: new Date('2026-08-21T00:00:00.000Z'),
    items: [
      {
        productId: 'product-1',
        name: 'The Wool Overcoat',
        quantity: 1,
        subtotal: 300,
      },
    ],
  },
  {
    _id: 'order-current-shipped',
    userId: 'user-1',
    status: 'shipped',
    totalPrice: 100,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    items: [
      {
        productId: 'product-1',
        name: 'The Wool Overcoat',
        quantity: 1,
        subtotal: 100,
      },
    ],
  },
  {
    _id: 'order-previous-completed',
    userId: 'user-1',
    status: 'completed',
    totalPrice: 50,
    createdAt: new Date('2026-07-15T00:00:00.000Z'),
    items: [
      {
        productId: 'product-1',
        name: 'The Wool Overcoat',
        quantity: 1,
        subtotal: 50,
      },
    ],
  },
];

describe('admin analytics mapper', () => {
  it('builds dashboard KPIs and rankings from real order records', () => {
    const result = buildDashboardOverview(
      { users, orders, products, categories },
      { now, range: '30d' },
    );

    expect(result.kpis.find((kpi) => kpi.key === 'revenue')?.value).toBe(300);
    expect(result.kpis.find((kpi) => kpi.key === 'orders')?.value).toBe(3);
    expect(result.kpis.find((kpi) => kpi.key === 'customers')?.value).toBe(1);
    expect(result.kpis.find((kpi) => kpi.key === 'aov')?.value).toBe(150);
    expect(result.categories).toEqual([{ label: 'Outerwear', value: 300 }]);
    expect(result.topProducts[0]).toEqual({
      name: 'The Wool Overcoat',
      sold: 3,
      revenue: 300,
    });
    expect(result.orderStatus).toEqual([
      { status: 'delivered', value: 1 },
      { status: 'shipped', value: 1 },
      { status: 'processing', value: 0 },
      { status: 'cancelled', value: 1 },
    ]);
  });

  it('builds customer summaries and excludes cancelled orders from spend', () => {
    const result = buildCustomerSummaries({ users, orders }, now);
    const customer = result.find((item) => item._id === 'user-1');
    const newCustomer = result.find((item) => item._id === 'user-2');

    expect(customer).toMatchObject({
      location: 'Ho Chi Minh City, VN',
      status: 'active',
      ordersCount: 4,
      totalSpent: 350,
    });
    expect(customer?.recentOrders).toHaveLength(3);
    expect(newCustomer?.status).toBe('new');
  });
});
