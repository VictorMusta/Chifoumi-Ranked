import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  permissions?: number;
  fpt?: string; // Fingerprint of the device
  iat?: number;
  exp?: number;
}

@Injectable()
export class CustomJwtService {
  /**
   * Génère un hash unique basé sur les caractéristiques du device (User-Agent, Language, etc.)
   */
  generateDeviceFingerprint(req: { headers: Record<string, string | string[] | undefined>; ip?: string }): string {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    
    // On peut inclure une partie de l'IP pour plus de sécurité (mais attention aux changements de réseau)
    // Ici on prend seulement les deux premiers octets pour tolérer les changements de box/antenne proches
    const ipPart = req.ip ? req.ip.split('.').slice(0, 2).join('.') : '';

    const data = `${userAgent}|${acceptLanguage}|${ipPart}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private encodeBase64Url(str: string | Buffer): string {
    const base64 =
      typeof str === 'string'
        ? Buffer.from(str).toString('base64')
        : str.toString('base64');
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private decodeBase64Url(base64Url: string): string {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString('utf8');
  }

  sign(
    payload: JwtPayload,
    secret: string,
    options: { expiresIn?: string | number } = {},
  ): string {
    const header = { alg: 'HS256', typ: 'JWT' };

    // Handle expiration
    const issuedAt = Math.floor(Date.now() / 1000);
    const enrichedPayload: Record<string, unknown> = {
      ...payload,
      iat: issuedAt,
    };

    if (options.expiresIn) {
      let expiresAt: number;
      if (typeof options.expiresIn === 'number') {
        expiresAt = issuedAt + options.expiresIn;
      } else {
        const value = parseInt(options.expiresIn);
        const unit = options.expiresIn.slice(-1);
        switch (unit) {
          case 'd':
            expiresAt = issuedAt + value * 24 * 60 * 60;
            break;
          case 'h':
            expiresAt = issuedAt + value * 60 * 60;
            break;
          case 'm':
            expiresAt = issuedAt + value * 60;
            break;
          case 's':
            expiresAt = issuedAt + value;
            break;
          default:
            expiresAt = issuedAt + value; // as seconds
        }
      }
      enrichedPayload.exp = expiresAt;
    }

    const encodedHeader = this.encodeBase64Url(JSON.stringify(header));
    const encodedPayload = this.encodeBase64Url(
      JSON.stringify(enrichedPayload),
    );

    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto
      .createHmac('sha256', secret)
      .update(signatureInput)
      .digest();

    const encodedSignature = this.encodeBase64Url(signature);

    return `${signatureInput}.${encodedSignature}`;
  }

  verify(token: string, secret: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Token JWT invalide');
    }

    const [header, payload, signature] = parts;
    const signatureInput = `${header}.${payload}`;

    const expectedSignature = this.encodeBase64Url(
      crypto.createHmac('sha256', secret).update(signatureInput).digest(),
    );

    if (signature !== expectedSignature) {
      throw new UnauthorizedException('Signature JWT invalide');
    }

    const decodedPayload = JSON.parse(
      this.decodeBase64Url(payload),
    ) as JwtPayload;

    if (
      decodedPayload.exp &&
      typeof decodedPayload.exp === 'number' &&
      Date.now() / 1000 > decodedPayload.exp
    ) {
      throw new UnauthorizedException('Token JWT expiré');
    }

    return decodedPayload;
  }
}
