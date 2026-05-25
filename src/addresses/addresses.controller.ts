import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Controller('api/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  async findAll(@CurrentUser() user: User) {
    return this.addressesService.findAll(user.id);
  }

  @Post()
  async create(@CurrentUser() user: User, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(user.id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.addressesService.remove(user.id, +id);
    return { message: 'Address deleted' };
  }
}
