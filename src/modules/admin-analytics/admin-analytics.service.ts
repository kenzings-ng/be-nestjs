import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from '../categories/schema/category.schema';
import { Order } from '../orders/schema/order.schema';
import { Product } from '../products/schema/product.schema';
import { User } from '../users/schema/user.schema';
import {
  AnalyticsCategory,
  AnalyticsOrder,
  AnalyticsProduct,
  AnalyticsUser,
  buildCustomerSummaries,
  buildDashboardOverview,
  DashboardRange,
} from './admin-analytics.mapper';

@Injectable()
export class AdminAnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async getDashboard(range: DashboardRange = '12m') {
    const data = await this.loadData();
    return buildDashboardOverview(data, { range });
  }

  async getCustomers() {
    const { users, orders } = await this.loadData();
    return buildCustomerSummaries({ users, orders });
  }

  async getCustomer(id: string) {
    const customer = (await this.getCustomers()).find(
      (item) => item._id === id,
    );
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  private async loadData() {
    const [orders, users, products, categories] = await Promise.all([
      this.orderModel.find().lean().exec(),
      this.userModel.find().lean().exec(),
      this.productModel.find().lean().exec(),
      this.categoryModel.find().lean().exec(),
    ]);

    return {
      orders: orders as unknown as AnalyticsOrder[],
      users: users as unknown as AnalyticsUser[],
      products: products as unknown as AnalyticsProduct[],
      categories: categories as unknown as AnalyticsCategory[],
    };
  }
}
