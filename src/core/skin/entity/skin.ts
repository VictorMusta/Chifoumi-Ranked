export class Skin {
  static readonly DEFAULT_SKIN_ID = 'default-skin';

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly productId: string | null,
    public readonly priceId: string | null,
    public readonly price: number,
    public readonly color: string,
    public readonly description?: string,
  ) {}

  static getDefault(): Skin {
    return new Skin(
      Skin.DEFAULT_SKIN_ID,
      'Neo-Brutalism (Défaut)',
      null,
      null,
      0,
      '#FFFDF5',
      'Le style original et épuré de Chifoumi.',
    );
  }
}
