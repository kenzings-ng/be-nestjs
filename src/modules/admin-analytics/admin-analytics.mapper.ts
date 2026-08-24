export type DashboardRange = '7d' | '30d' | '90d' | '12m';
export type DashboardOrderStatus =
  'delivered' | 'shipped' | 'processing' | 'cancelled';
export type CustomerStatus = 'active' | 'new' | 'vip' | 'dormant';

export interface AnalyticsUser {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  createdAt: Date | string;
  profile?: { address?: { city?: string; country?: string } };
}

export interface AnalyticsOrderItem {
  productId: unknown;
  name: string;
  price?: number;
  quantity: number;
  subtotal: number;
}

export interface AnalyticsOrder {
  _id: unknown;
  userId: unknown;
  status: string;
  totalPrice: number;
  createdAt: Date | string;
  items: AnalyticsOrderItem[];
}

export interface AnalyticsProduct {
  _id: unknown;
  name: string;
  categoryId?: unknown;
}

export interface AnalyticsCategory {
  _id: unknown;
  title: string;
}

export interface DashboardOverview {
  kpis: Array<{
    key: string;
    label: string;
    value: number;
    format: 'currency' | 'number';
    deltaPct: number;
    spark: number[];
  }>;
  revenue: Array<{ label: string; value: number }>;
  categories: Array<{ label: string; value: number }>;
  orderStatus: Array<{ status: DashboardOrderStatus; value: number }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    date: string;
    total: number;
    status: DashboardOrderStatus;
  }>;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
}

export interface CustomerSummary {
  _id: string;
  name: string;
  email: string;
  location: string;
  status: CustomerStatus;
  joinedAt: string;
  ordersCount: number;
  totalSpent: number;
  recentOrders: Array<{ number: string; createdAt: string; total: number }>;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_DAYS: Record<DashboardRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
};
const REVENUE_STATUSES = new Set(['paid', 'shipped', 'completed']);

export function buildDashboardOverview(
  data: {
    users: AnalyticsUser[];
    orders: AnalyticsOrder[];
    products: AnalyticsProduct[];
    categories: AnalyticsCategory[];
  },
  options: { now?: Date; range?: DashboardRange } = {},
): DashboardOverview {
  const now = options.now ?? new Date();
  const range = options.range ?? '12m';
  const duration = RANGE_DAYS[range] * DAY_MS;
  const currentStart = new Date(now.getTime() - duration);
  const previousStart = new Date(currentStart.getTime() - duration);
  const currentOrders = between(data.orders, currentStart, now);
  const previousOrders = between(data.orders, previousStart, currentStart);
  const currentRevenueOrders = currentOrders.filter(isRevenueOrder);
  const previousRevenueOrders = previousOrders.filter(isRevenueOrder);
  const currentCustomers = betweenUsers(data.users, currentStart, now);
  const previousCustomers = betweenUsers(
    data.users,
    previousStart,
    currentStart,
  );
  const currentRevenue = sum(
    currentRevenueOrders.map((order) => order.totalPrice),
  );
  const previousRevenue = sum(
    previousRevenueOrders.map((order) => order.totalPrice),
  );
  const currentAov = average(
    currentRevenueOrders.map((order) => order.totalPrice),
  );
  const previousAov = average(
    previousRevenueOrders.map((order) => order.totalPrice),
  );
  const userById = new Map(data.users.map((user) => [idOf(user._id), user]));

  return {
    kpis: [
      metric(
        'revenue',
        'Total revenue',
        currentRevenue,
        'currency',
        previousRevenue,
        trend(currentOrders, currentStart, now, range, revenueValue),
      ),
      metric(
        'orders',
        'Orders',
        currentOrders.length,
        'number',
        previousOrders.length,
        trend(currentOrders, currentStart, now, range, () => 1),
      ),
      metric(
        'customers',
        'Customers',
        currentCustomers.length,
        'number',
        previousCustomers.length,
        trendUsers(data.users, currentStart, now, range),
      ),
      metric(
        'aov',
        'Avg. order value',
        currentAov,
        'currency',
        previousAov,
        trendAov(currentOrders, currentStart, now, range),
      ),
    ],
    revenue: trendPoints(currentOrders, currentStart, now, range, revenueValue),
    categories: categorySales(
      currentRevenueOrders,
      data.products,
      data.categories,
    ),
    orderStatus: statusCounts(currentOrders),
    recentOrders: [...data.orders]
      .sort(
        (a, b) => dateOf(b.createdAt).getTime() - dateOf(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((order) => ({
        id: orderNumber(order._id),
        customer: userById.get(idOf(order.userId))?.name ?? 'Unknown customer',
        date: dateOf(order.createdAt).toISOString(),
        total: order.totalPrice,
        status: dashboardStatus(order.status),
      })),
    topProducts: productSales(currentRevenueOrders).slice(0, 5),
  };
}

export function buildCustomerSummaries(
  data: { users: AnalyticsUser[]; orders: AnalyticsOrder[] },
  now = new Date(),
): CustomerSummary[] {
  const ordersByUser = new Map<string, AnalyticsOrder[]>();
  for (const order of data.orders) {
    const userOrders = ordersByUser.get(idOf(order.userId)) ?? [];
    userOrders.push(order);
    ordersByUser.set(idOf(order.userId), userOrders);
  }

  return data.users
    .filter((user) => user.role === 'user')
    .map((user) => {
      const orders = [...(ordersByUser.get(idOf(user._id)) ?? [])].sort(
        (a, b) => dateOf(b.createdAt).getTime() - dateOf(a.createdAt).getTime(),
      );
      const totalSpent = sum(
        orders.filter(isRevenueOrder).map((order) => order.totalPrice),
      );
      const city = user.profile?.address?.city;
      const country = user.profile?.address?.country;

      return {
        _id: idOf(user._id),
        name: user.name,
        email: user.email,
        location: [city, country].filter(Boolean).join(', ') || '—',
        status: customerStatus(user, orders, totalSpent, now),
        joinedAt: dateOf(user.createdAt).toISOString(),
        ordersCount: orders.length,
        totalSpent,
        recentOrders: orders.slice(0, 3).map((order) => ({
          number: orderNumber(order._id),
          createdAt: dateOf(order.createdAt).toISOString(),
          total: order.totalPrice,
        })),
      };
    });
}

function metric(
  key: string,
  label: string,
  value: number,
  format: 'currency' | 'number',
  previous: number,
  spark: number[],
) {
  return {
    key,
    label,
    value: round(value),
    format,
    deltaPct: percentageDelta(value, previous),
    spark,
  };
}

function categorySales(
  orders: AnalyticsOrder[],
  products: AnalyticsProduct[],
  categories: AnalyticsCategory[],
) {
  const productById = new Map(
    products.map((product) => [idOf(product._id), product]),
  );
  const categoryById = new Map(
    categories.map((category) => [idOf(category._id), category.title]),
  );
  const totals = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const product = productById.get(idOf(item.productId));
      const label = product?.categoryId
        ? (categoryById.get(idOf(product.categoryId)) ?? 'Uncategorized')
        : 'Uncategorized';
      totals.set(label, (totals.get(label) ?? 0) + item.subtotal);
    }
  }
  return [...totals.entries()]
    .map(([label, value]) => ({ label, value: round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
}

function productSales(orders: AnalyticsOrder[]) {
  const totals = new Map<
    string,
    { name: string; sold: number; revenue: number }
  >();
  for (const order of orders) {
    for (const item of order.items) {
      const key = idOf(item.productId) || item.name;
      const current = totals.get(key) ?? {
        name: item.name,
        sold: 0,
        revenue: 0,
      };
      current.sold += item.quantity;
      current.revenue += item.subtotal;
      totals.set(key, current);
    }
  }
  return [...totals.values()]
    .map((item) => ({ ...item, revenue: round(item.revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
}

function statusCounts(orders: AnalyticsOrder[]) {
  const statuses: DashboardOrderStatus[] = [
    'delivered',
    'shipped',
    'processing',
    'cancelled',
  ];
  return statuses.map((status) => ({
    status,
    value: orders.filter((order) => dashboardStatus(order.status) === status)
      .length,
  }));
}

function dashboardStatus(status: string): DashboardOrderStatus {
  if (status === 'completed') return 'delivered';
  if (status === 'shipped') return 'shipped';
  if (status === 'cancelled') return 'cancelled';
  return 'processing';
}

function customerStatus(
  user: AnalyticsUser,
  orders: AnalyticsOrder[],
  totalSpent: number,
  now: Date,
): CustomerStatus {
  if (dateOf(user.createdAt).getTime() >= now.getTime() - 30 * DAY_MS)
    return 'new';
  if (totalSpent >= 1000 || orders.length >= 8) return 'vip';
  const latestOrder = orders[0];
  if (
    !latestOrder ||
    dateOf(latestOrder.createdAt).getTime() < now.getTime() - 120 * DAY_MS
  ) {
    return 'dormant';
  }
  return 'active';
}

function trend(
  orders: AnalyticsOrder[],
  start: Date,
  end: Date,
  range: DashboardRange,
  value: (order: AnalyticsOrder) => number,
) {
  return trendPoints(orders, start, end, range, value).map(
    (point) => point.value,
  );
}

function trendUsers(
  users: AnalyticsUser[],
  start: Date,
  end: Date,
  range: DashboardRange,
) {
  return bucketValues(
    users.filter((user) => user.role === 'user'),
    start,
    end,
    range,
    (user) => dateOf(user.createdAt),
    () => 1,
  ).values;
}

function trendAov(
  orders: AnalyticsOrder[],
  start: Date,
  end: Date,
  range: DashboardRange,
) {
  const eligible = orders.filter(isRevenueOrder);
  const sums = bucketValues(
    eligible,
    start,
    end,
    range,
    (order) => dateOf(order.createdAt),
    revenueValue,
  );
  const counts = bucketValues(
    eligible,
    start,
    end,
    range,
    (order) => dateOf(order.createdAt),
    () => 1,
  );
  return sums.values.map((value, index) =>
    round(counts.values[index] ? value / counts.values[index] : 0),
  );
}

function trendPoints(
  orders: AnalyticsOrder[],
  start: Date,
  end: Date,
  range: DashboardRange,
  value: (order: AnalyticsOrder) => number,
) {
  const buckets = bucketValues(
    orders,
    start,
    end,
    range,
    (order) => dateOf(order.createdAt),
    value,
  );
  return buckets.values.map((total, index) => ({
    label: buckets.labels[index],
    value: round(total),
  }));
}

function bucketValues<T>(
  items: T[],
  start: Date,
  end: Date,
  range: DashboardRange,
  date: (item: T) => Date,
  value: (item: T) => number,
) {
  const count =
    range === '7d' ? 7 : range === '12m' ? 12 : range === '90d' ? 12 : 10;
  const span = end.getTime() - start.getTime();
  const values = Array.from({ length: count }, () => 0);
  const labels = Array.from({ length: count }, (_, index) => {
    const point = new Date(start.getTime() + ((index + 0.5) / count) * span);
    return range === '12m'
      ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(point)
      : new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
        }).format(point);
  });
  for (const item of items) {
    const offset = date(item).getTime() - start.getTime();
    const index = Math.min(
      count - 1,
      Math.max(0, Math.floor((offset / span) * count)),
    );
    values[index] += value(item);
  }
  return { labels, values: values.map((value) => round(value)) };
}

function between(orders: AnalyticsOrder[], start: Date, end: Date) {
  return orders.filter((order) => {
    const time = dateOf(order.createdAt).getTime();
    return time >= start.getTime() && time < end.getTime();
  });
}

function betweenUsers(users: AnalyticsUser[], start: Date, end: Date) {
  return users.filter((user) => {
    const time = dateOf(user.createdAt).getTime();
    return (
      user.role === 'user' && time >= start.getTime() && time < end.getTime()
    );
  });
}

function isRevenueOrder(order: AnalyticsOrder) {
  return REVENUE_STATUSES.has(order.status);
}

function revenueValue(order: AnalyticsOrder) {
  return isRevenueOrder(order) ? order.totalPrice : 0;
}

function percentageDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100, 1);
}

function orderNumber(value: unknown) {
  return '#ORD-' + idOf(value).slice(-8).toUpperCase();
}

function dateOf(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function idOf(value: unknown) {
  return value === null || value === undefined ? '' : String(value);
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]) {
  return values.length ? sum(values) / values.length : 0;
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
