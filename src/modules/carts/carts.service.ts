import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from '../products/schema/product.schema';
import { Cart } from './schema/cart.schema';
import { AddCartItemDto } from './dto/add-cart-item.dto';

// Shape of a product once populated onto a cart line.
interface PopulatedProduct {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  price: number;
  images?: string[];
  stock: number;
}

export interface CartView {
  userId: string;
  items: Array<{
    productId: Types.ObjectId | null;
    slug?: string;
    name: string;
    price: number;
    image?: string;
    color?: string;
    size?: string;
    quantity: number;
    subtotal: number;
    stock: number;
    inStock: boolean;
    available: boolean;
  }>;
  totalItems: number;
  totalPrice: number;
}

/** Two lines are "the same" only if product AND variant match. */
function sameLine(
  item: { productId: Types.ObjectId; color?: string; size?: string },
  productId: string,
  color: string | undefined,
  size: string | undefined,
): boolean {
  return (
    item.productId.toString() === productId &&
    (item.color ?? '') === (color ?? '') &&
    (item.size ?? '') === (size ?? '')
  );
}

@Injectable()
export class CartsService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  /** Raw cart document (or null). Used internally by checkout. */
  getRawCart(userId: string) {
    return this.cartModel.findOne({ userId }).exec();
  }

  /** Fetch the user's cart, creating an empty one if it doesn't exist yet. */
  private async getOrCreate(userId: string) {
    return this.cartModel
      .findOneAndUpdate(
        { userId },
        { $setOnInsert: { userId, items: [] } },
        { new: true, upsert: true },
      )
      .exec();
  }

  /** The user-facing cart: product details populated + live totals computed. */
  async getMyCart(userId: string): Promise<CartView> {
    const cart = await this.cartModel
      .findOne({ userId })
      .populate<{
        items: Array<{
          productId: PopulatedProduct | null;
          color?: string;
          size?: string;
          quantity: number;
        }>;
      }>('items.productId', 'slug name price images stock')
      .lean()
      .exec();

    if (!cart) {
      return { userId, items: [], totalItems: 0, totalPrice: 0 };
    }

    const items = cart.items.map((it) => {
      const p = it.productId;
      if (!p) {
        // Product was deleted after being added to the cart.
        return {
          productId: null,
          slug: undefined,
          name: '(sản phẩm không còn tồn tại)',
          price: 0,
          color: it.color,
          size: it.size,
          quantity: it.quantity,
          subtotal: 0,
          stock: 0,
          inStock: false,
          available: false,
        };
      }
      return {
        productId: p._id,
        slug: p.slug,
        name: p.name,
        price: p.price,
        image: p.images?.[0],
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        subtotal: p.price * it.quantity,
        stock: p.stock,
        inStock: p.stock >= it.quantity,
        available: true,
      };
    });

    const valid = items.filter((i) => i.available);
    return {
      userId,
      items,
      totalItems: valid.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: valid.reduce((sum, i) => sum + i.subtotal, 0),
    };
  }

  /** Add a product+variant to the cart. Merges quantity if the same line exists. */
  async addItem(userId: string, dto: AddCartItemDto): Promise<CartView> {
    const product = await this.productModel.findById(dto.productId).exec();
    if (!product) {
      throw new NotFoundException('Sản phẩm không tồn tại');
    }

    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find((i) =>
      sameLine(i, dto.productId, dto.color, dto.size),
    );
    if (existing) {
      existing.quantity += dto.quantity;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(dto.productId),
        color: dto.color,
        size: dto.size,
        quantity: dto.quantity,
      });
    }
    await cart.save();
    return this.getMyCart(userId);
  }

  /** Set the absolute quantity of an existing product+variant line. */
  async setItemQuantity(
    userId: string,
    productId: string,
    color: string | undefined,
    size: string | undefined,
    quantity: number,
  ): Promise<CartView> {
    const cart = await this.getRawCart(userId);
    const item = cart?.items.find((i) => sameLine(i, productId, color, size));
    if (!cart || !item) {
      throw new NotFoundException('Sản phẩm không có trong giỏ');
    }
    item.quantity = quantity;
    await cart.save();
    return this.getMyCart(userId);
  }

  /** Remove a single product+variant line from the cart. */
  async removeItem(
    userId: string,
    productId: string,
    color: string | undefined,
    size: string | undefined,
  ): Promise<CartView> {
    const cart = await this.getRawCart(userId);
    if (cart) {
      cart.items = cart.items.filter(
        (i) => !sameLine(i, productId, color, size),
      );
      await cart.save();
    }
    return this.getMyCart(userId);
  }

  /** Empty the cart (also called after a successful checkout). */
  async clearCart(userId: string): Promise<CartView> {
    await this.cartModel.updateOne({ userId }, { $set: { items: [] } }).exec();
    return this.getMyCart(userId);
  }
}
