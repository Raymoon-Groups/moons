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

export function getPasswordValidationError(password: string): string | null {
  if (!password) {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }
  if (!/^[A-Z]/.test(password)) {
    return 'Password must start with a capital letter';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'Password must be at least 8 characters long';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character';
  }
  if (/\s/.test(password)) {
    return 'Password must not contain spaces';
  }
  return null;
}
