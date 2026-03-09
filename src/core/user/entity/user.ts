export class User {
    constructor(
        public readonly id: string,
        public readonly username: string,
        public readonly email: string,
        public readonly hashedPassword: string
    ) {}
}
