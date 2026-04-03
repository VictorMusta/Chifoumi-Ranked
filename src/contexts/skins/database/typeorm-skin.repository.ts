import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SkinOrmEntity } from './skin.entity';
import { Skin } from '../../../core/skin/entity/skin';

@Injectable()
export class TypeOrmSkinRepository {
  constructor(
    @InjectRepository(SkinOrmEntity)
    private readonly repository: Repository<SkinOrmEntity>,
  ) {}

  async save(skin: Skin): Promise<void> {
    const ormEntity = Object.assign(new SkinOrmEntity(), {
      id: skin.id,
      name: skin.name,
      productId: skin.productId,
      priceId: skin.priceId,
      price: skin.price,
      color: skin.color,
      description: skin.description,
    });
    await this.repository.save(ormEntity);
  }

  async findAll(): Promise<Skin[]> {
    const ormEntities = await this.repository.find();
    return ormEntities.map(
      (e) =>
        new Skin(
          e.id,
          e.name,
          e.productId,
          e.priceId,
          e.price,
          e.color,
          e.description || undefined,
        ),
    );
  }

  async findById(id: string): Promise<Skin | null> {
    const e = await this.repository.findOne({ where: { id } });
    if (!e) return null;
    return new Skin(
      e.id,
      e.name,
      e.productId,
      e.priceId,
      e.price,
      e.color,
      e.description || undefined,
    );
  }
}
