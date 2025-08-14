import bcrypt from 'bcryptjs';

/**
 * Password validation interface for strength checking
 */
export interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
  checks: PasswordChecks;
  suggestions: string[];
}

/**
 * Individual password check results
 */
export interface PasswordChecks {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  numbers: boolean;
  symbols: boolean;
  noCommonPatterns: boolean;
}

/**
 * Hash a password using bcrypt with 12 rounds minimum
 * @param password - Plain text password to hash
 * @returns Promise<string> - Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }

  // Use 12 rounds as specified in requirements (minimum security standard)
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against its hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns Promise<boolean> - True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash || typeof password !== 'string' || typeof hash !== 'string') {
    return false;
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a temporary password for admin use
 * @param length - Length of the password (default: 12)
 * @returns string - Generated temporary password
 */
export function generateTempPassword(length: number = 12): string {
  if (length < 8) {
    throw new Error('Temporary password must be at least 8 characters long');
  }

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  const allChars = lowercase + uppercase + numbers + symbols;
  
  let password = '';
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Validate password strength with real-time feedback
 * @param password - Password to validate
 * @returns PasswordValidation - Detailed validation results
 */
export function validatePasswordStrength(password: string): PasswordValidation {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      strength: 'weak',
      score: 0,
      checks: {
        length: false,
        lowercase: false,
        uppercase: false,
        numbers: false,
        symbols: false,
        noCommonPatterns: false
      },
      suggestions: ['Password is required']
    };
  }

  const checks: PasswordChecks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    noCommonPatterns: !hasCommonPatterns(password)
  };

  const suggestions: string[] = [];
  let score = 0;

  // Calculate score based on checks
  if (checks.length) score += 2;
  else suggestions.push('Use at least 8 characters');

  if (checks.lowercase) score += 1;
  else suggestions.push('Include lowercase letters');

  if (checks.uppercase) score += 1;
  else suggestions.push('Include uppercase letters');

  if (checks.numbers) score += 1;
  else suggestions.push('Include numbers');

  if (checks.symbols) score += 2;
  else suggestions.push('Include special characters (!@#$%^&*)');

  if (checks.noCommonPatterns) score += 2;
  else suggestions.push('Avoid common patterns like "123" or "abc"');

  // Bonus points for longer passwords
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score <= 3) strength = 'weak';
  else if (score <= 5) strength = 'medium';
  else if (score <= 7) strength = 'strong';
  else strength = 'very-strong';

  const isValid = score >= 6 && checks.length && checks.lowercase && checks.uppercase && checks.numbers;

  return {
    isValid,
    strength,
    score,
    checks,
    suggestions: suggestions.length > 0 ? suggestions : ['Password meets security requirements']
  };
}

/**
 * Check for common password patterns that should be avoided
 * @param password - Password to check
 * @returns boolean - True if common patterns are found
 */
function hasCommonPatterns(password: string): boolean {
  const commonPatterns = [
    /123/,
    /abc/i,
    /qwerty/i,
    /password/i,
    /admin/i,
    /user/i,
    /login/i,
    /(.)\1{2,}/, // Repeated characters (aaa, 111, etc.)
    /^(.+)\1+$/, // Repeated sequences (abcabc, 123123, etc.)
  ];

  return commonPatterns.some(pattern => pattern.test(password));
}

/**
 * Get password strength color for UI display
 * @param strength - Password strength level
 * @returns string - CSS color class or hex color
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong' | 'very-strong'): string {
  switch (strength) {
    case 'weak': return '#ef4444'; // red-500
    case 'medium': return '#f59e0b'; // amber-500
    case 'strong': return '#10b981'; // emerald-500
    case 'very-strong': return '#059669'; // emerald-600
    default: return '#6b7280'; // gray-500
  }
}

/**
 * Get password strength percentage for progress bars
 * @param score - Password strength score
 * @returns number - Percentage (0-100)
 */
export function getPasswordStrengthPercentage(score: number): number {
  // Maximum realistic score is around 10
  return Math.min(Math.round((score / 10) * 100), 100);
}