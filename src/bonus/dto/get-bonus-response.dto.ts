import { ApiProperty } from '@nestjs/swagger';

export class GetBonusResponseDto {
  @ApiProperty({ example: 4.56 })
  balance: number;

  @ApiProperty({ example: 4 })
  spendable: number;

  @ApiProperty({ type: [Object] })
  history: {
    id: number;
    amount: number;
    type: string;
    orderId: number | null;
    description: string | null;
    createdAt: Date;
  }[];
}
