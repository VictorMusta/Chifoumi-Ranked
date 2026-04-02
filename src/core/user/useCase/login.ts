import { UserRepository } from '../ports/user-repository';
import { PasswordHasher } from '../ports/password-hasher';
import { TokenGenerator } from '../ports/token-generator';

export interface LoginDto {
  identifier: string; // Peut être un email ou un username
  password: string;
}

export interface LoginResult {
  accessToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResult> {
    // Tenter de trouver par email d'abord, puis par username
    let user = await this.userRepository.findByEmail(dto.identifier);
    if (!user) {
      user = await this.userRepository.findByUsername(dto.identifier);
    }
    
    if (!user) throw new Error('Invalid credentials');

    const isValid = await this.passwordHasher.verify(dto.password, user.hashedPassword);
    if (!isValid) throw new Error('Invalid credentials');

    // Les permissions sont embarquées dans le JWT pour être lues par PermissionsGuard
    const accessToken = this.tokenGenerator.generate({
      sub: user.id,
      id: user.id, // Doubler pour compatibilité id/sub
      username: user.username,
      email: user.email,
      permissions: user.permissions,
    });

    return { accessToken };
  }
}
