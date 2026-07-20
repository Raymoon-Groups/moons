/** Keep in sync with packages/shared/src/password.ts */
export const PASSWORD_MIN_LENGTH = 8;

/** Starts with capital, ≥8 chars, at least one digit and one special character */
export const PASSWORD_PATTERN =
  /^(?=.*\d)(?=.*[^A-Za-z0-9])[A-Z][\S]{7,}$/;

export const PASSWORD_REQUIREMENTS_MESSAGE =
  'Password must start with a capital letter, be at least 8 characters long, and include at least one number and one special character.';
