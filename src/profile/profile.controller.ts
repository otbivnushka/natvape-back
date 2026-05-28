import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';
import { AddressesService } from '../addresses/addresses.service';
import { IsString, IsOptional, MinLength } from 'class-validator';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('api/profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(
    private usersService: UsersService,
    private ordersService: OrdersService,
    private addressesService: AddressesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get current user profile with stats and addresses',
  })
  async getProfile(@CurrentUser() user: User) {
    const orders = await this.ordersService.findAll(user.id);
    const addresses = await this.addressesService.findAll(user.id);
    const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

    return {
      id: user.id,
      name: user.name,
      isAdmin: user.isAdmin,
      telegramUsername: user.telegramUsername,
      addresses,
      totalSpent,
      ordersCount: orders.length,
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile (name, phone, avatar)' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    const updated = await this.usersService.update(user.id, dto);
    return {
      id: updated!.id,
      name: updated!.name,
    };
  }
}
