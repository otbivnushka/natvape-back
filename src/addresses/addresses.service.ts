import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Address } from './entities/address.entity';
import { Order } from '../orders/entities/order.entity';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async findAll(userId: number) {
    return this.addressesRepository.find({
      where: { userId },
      select: { id: true, label: true, lat: true, lng: true },
    });
  }

  async findAllPickup() {
    return this.addressesRepository.find({
      where: { isPickup: true },
      select: { id: true, label: true, lat: true, lng: true },
    });
  }

  async create(userId: number, dto: CreateAddressDto) {
    const address = this.addressesRepository.create({ userId, ...dto });
    return this.addressesRepository.save(address);
  }

  async remove(userId: number, addressId: number) {
    const address = await this.addressesRepository.findOne({
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    const activeOrders = await this.ordersRepository.count({
      where: { addressId, status: Not('end') },
    });
    if (activeOrders > 0) {
      throw new BadRequestException('Cannot delete address with active orders');
    }

    await this.addressesRepository.remove(address);
  }
}
