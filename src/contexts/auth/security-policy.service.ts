import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export enum SecurityMode {
  STRICT = 'STRICT',     // Block request if fingerprint mismatch
  LOG_ONLY = 'LOG_ONLY', // Just log warning, allow request
  EXPIRE = 'EXPIRE',     // Force immediate expiration (future use)
}

@Injectable()
export class SecurityPolicyService {
  private readonly logger = new Logger(SecurityPolicyService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Determine the security mode based on global config and user context
   */
  getSecurityMode(user?: { permissions: number }): SecurityMode {
    const globalMode = this.configService.get<string>('SECURITY_MODE', SecurityMode.LOG_ONLY) as SecurityMode;

    // Custom logic: Admins (permissions >= 3) are always in STRICT mode
    if (user && user.permissions >= 3) {
      return SecurityMode.STRICT;
    }

    return globalMode;
  }

  /**
   * Handle a security breach according to the mode
   * @Returns true if request should continue, false if it should be blocked
   */
  handleMismatch(mode: SecurityMode, details: string): boolean {
    const warning = `[SECURITY ALERT] Device fingerprint mismatch detected: ${details}`;
    
    switch (mode) {
      case SecurityMode.STRICT:
        this.logger.error(`${warning} -> REJECTING REQUEST`);
        return false;

      case SecurityMode.LOG_ONLY:
        this.logger.warn(`${warning} -> ALLOWING (LOG_ONLY mode)`);
        return true;

      default:
        this.logger.warn(`${warning} -> ALLOWING (Fallback)`);
        return true;
    }
  }
}
