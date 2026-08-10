import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// Every cart action is scoped to the logged-in user (id taken from the JWT).
@ApiTags('carts')
@ApiBearerAuth('access-token')
@Controller('carts')
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  // Get the current user's cart (with product details + totals).
  @Get()
  getMyCart(@CurrentUser('userId') userId: string) {
    return this.cartsService.getMyCart(userId);
  }

  // Add a product+variant (merges quantity if the same line already exists).
  @Post('items')
  addItem(@CurrentUser('userId') userId: string, @Body() dto: AddCartItemDto) {
    return this.cartsService.addItem(userId, dto);
  }

  // Set the absolute quantity of one product+variant line.
  // color/size identify the exact line, e.g. PATCH /carts/items/<id>?color=Camel&size=M
  @Patch('items/:productId')
  updateItem(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
    @Query('color') color: string | undefined,
    @Query('size') size: string | undefined,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartsService.setItemQuantity(
      userId,
      productId,
      color,
      size,
      dto.quantity,
    );
  }

  // Remove one product+variant line from the cart.
  @Delete('items/:productId')
  removeItem(
    @CurrentUser('userId') userId: string,
    @Param('productId') productId: string,
    @Query('color') color: string | undefined,
    @Query('size') size: string | undefined,
  ) {
    return this.cartsService.removeItem(userId, productId, color, size);
  }

  // Empty the whole cart.
  @Delete()
  clear(@CurrentUser('userId') userId: string) {
    return this.cartsService.clearCart(userId);
  }
}
