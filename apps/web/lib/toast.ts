type ToastKind = 'success' | 'error' | 'info';

export type AppToast = {
  id: string;
  kind: ToastKind;
  title: string;
  description?: string;
  durationMs: number;
};

type ToastInput = {
  title: string;
  description?: string;
  kind?: ToastKind;
  durationMs?: number;
};

type Listener = (toasts: AppToast[]) => void;

const DEFAULT_DURATION = 4200;
const MAX_VISIBLE = 3;

let toasts: AppToast[] = [];
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

function pushToast(input: ToastInput) {
  const toast: AppToast = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind ?? 'success',
    title: input.title,
    description: input.description,
    durationMs: input.durationMs ?? DEFAULT_DURATION,
  };
  toasts = [toast, ...toasts].slice(0, MAX_VISIBLE);
  emit();
  return toast.id;
}

export function dismissToast(id: string) {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export const notify = {
  success(title: string, description?: string) {
    return pushToast({ kind: 'success', title, description });
  },
  error(title: string, description?: string) {
    return pushToast({ kind: 'error', title, description });
  },
  info(title: string, description?: string) {
    return pushToast({ kind: 'info', title, description });
  },
};
