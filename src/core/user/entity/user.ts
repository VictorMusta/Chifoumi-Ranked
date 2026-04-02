export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly email: string,
    public readonly hashedPassword: string,
    public readonly permissions: number,
    public subscriptionTier: number = 0,
    public remainingTrialMatches: number = 5,
    public generatedReferralCode: string | null = null,
  ) {}
}
