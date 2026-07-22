/** Registration / new-password rules */
export const PASSWORD_MIN_LENGTH = 8;

/** Starts with capital, ≥8 chars, at least one digit and one special character */
export const PASSWORD_PATTERN =
  /^(?=.*\d)(?=.*[^A-Za-z0-9])[A-Z][\S]{7,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must start with a capital letter, be at least 8 characters long, and include at least one number and one special character.';

export function isValidPassword(password: string): boolean {
  return PASSWORD_PATTERN.test(password);
}

/** Returns every failed password rule so the UI can show them together. */
export function getPasswordValidationErrors(password: string): string[] {
  const errors: string[] = [];

  if (!password) {
    return [
      'Password must start with a capital letter',
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      'Password must include at least one number',
      'Password must include at least one special character',
    ];
  }

  if (!/^[A-Z]/.test(password)) {
    errors.push('Password must start with a capital letter');
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }
  if (!/\d/.test(password)) {
    errors.push('Password must include at least one number');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must include at least one special character');
  }
  if (/\s/.test(password)) {
    errors.push('Password must not contain spaces');
  }

  return errors;
}

export function getPasswordValidationError(password: string): string | null {
  const errors = getPasswordValidationErrors(password);
  return errors.length > 0 ? errors.join('\n') : null;
}
