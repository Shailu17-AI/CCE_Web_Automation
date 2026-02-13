import { storageService } from './storageService';

export const authService = {
  /**
   * Verify HOD Passcode.
   * Returns true if passcode matches the stored one.
   */
  verifyHodPasscode(code: string): boolean {
    const stored = storageService.getHodPasscode();
    return stored === code;
  },

  /**
   * Verify Class Advisor Passcode.
   * Returns true if passcode matches the stored one for the given advisor ID.
   */
  verifyAdvisorPasscode(advisorId: string, code: string): boolean {
    const advisors = storageService.getAdvisors();
    const advisor = advisors.find(a => a.id === advisorId);
    return advisor ? advisor.passcode === code : false;
  }
};