import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';

@Controller('api/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Get()
  async getWishlist(@CurrentUser() user: User) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post()
  async addItem(@CurrentUser() user: User, @Body() dto: AddToWishlistDto) {
    return this.wishlistService.addItem(user.id, dto.productId);
  }

  @Delete(':productId')
  async removeItem(@CurrentUser() user: User, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(user.id, +productId);
  }
}
