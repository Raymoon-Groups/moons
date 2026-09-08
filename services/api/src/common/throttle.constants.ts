/** Shared throttle presets for @Throttle() decorators (ttl is milliseconds). */
export const THROTTLE = {
  /** Auth endpoints: login, Google, register, refresh */
  auth: { default: { limit: 20, ttl: 60_000 } },
  /** Stricter auth bursts (login / OTP verify style) */
  authStrict: { default: { limit: 10, ttl: 60_000 } },
  /** Create posts */
  createPost: { default: { limit: 10, ttl: 3_600_000 } },
  /** Comments + shares + likes */
  engage: { default: { limit: 40, ttl: 3_600_000 } },
  /** Send messages */
  sendMessage: { default: { limit: 40, ttl: 3_600_000 } },
  /** Connection requests */
  connectionRequest: { default: { limit: 15, ttl: 3_600_000 } },
  /** Newsletter / public forms */
  publicForm: { default: { limit: 5, ttl: 3_600_000 } },
} as const;
