import { UserRepository } from "../ports/user-repository";
import { PasswordHasher } from "../ports/password-hasher";
import { IdGenerator } from "../ports/id-generator";
import { UserDto } from "../dto/user";
import { User } from "../entity/user";

export class RegisterUseCase {
    constructor(
        private readonly userRepository: UserRepository,
        private readonly passwordHasher: PasswordHasher,
        private readonly idGenerator: IdGenerator
    ) {}

    async execute(dto: UserDto): Promise<User> {
        let userAlreadyExists: boolean;
        userAlreadyExists = await this.userRepository.findByEmail(dto.email) !== null || await this.userRepository.findByUsername(dto.username) !== null;
        if (userAlreadyExists) {
            throw new Error('User already exists');
        }
        const id = this.idGenerator.generate();
        const hashedPassword = await this.passwordHasher.hash(dto.password);
        const user = new User(id, dto.username, dto.email, hashedPassword);
        await this.userRepository.save(user);
        return user;
    }
}
