export class UserDto {
  constructor(
    public readonly username: string,
    public readonly email: string,
    public readonly password: string,
    public readonly permissions: number = 0,
  ) {}
}