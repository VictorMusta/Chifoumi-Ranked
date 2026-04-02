import { IdGenerator } from '../../../core/user/ports/id-generator';
import { v4 as uuidv4 } from 'uuid';

export class UuidGenerator implements IdGenerator {
  generate(): string {
    return uuidv4();
  }
}
