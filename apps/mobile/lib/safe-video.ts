/** Safely call expo-video play/pause — web rejects with AbortError when interrupted. */
export function safeVideoPlay(player: { play: () => unknown }) {
  try {
    const result = player.play();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      void (result as Promise<unknown>).catch(() => {
        // AbortError / NotAllowedError when play races with pause or power-saving.
      });
    }
  } catch {
    // ignore
  }
}

export function safeVideoPause(player: { pause: () => unknown }) {
  try {
    const result = player.pause();
    if (result && typeof (result as Promise<unknown>).then === 'function') {
      void (result as Promise<unknown>).catch(() => {
        // ignore
      });
    }
  } catch {
    // ignore
  }
}
