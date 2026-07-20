const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

type CredentialCallback = (credential: string) => void;

interface GsiButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  logo_alignment?: 'left' | 'center';
}

let scriptPromise: Promise<void> | null = null;
let initialized = false;
let activeClientId: string | null = null;
const listeners = new Set<CredentialCallback>();

function dispatchCredential(credential: string) {
  for (const listener of listeners) {
    listener(credential);
  }
}

export function loadGoogleGsiScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SCRIPT_URL}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Failed to load Google Sign-In')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/** Initialize GSI once for the whole app — avoids duplicate initialize() warnings. */
export async function ensureGoogleGsiInitialized(clientId: string): Promise<void> {
  await loadGoogleGsiScript();

  if (initialized && activeClientId === clientId) {
    return;
  }

  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        dispatchCredential(response.credential);
      }
    },
  });

  initialized = true;
  activeClientId = clientId;
}

export function subscribeGoogleCredential(callback: CredentialCallback): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export async function renderGoogleSignInButton(
  parent: HTMLElement,
  options: GsiButtonOptions,
): Promise<void> {
  parent.replaceChildren();
  window.google.accounts.id.renderButton(parent, options);
}
