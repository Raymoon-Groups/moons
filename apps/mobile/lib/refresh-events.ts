type RefreshEvent =
  | 'moons:connections-refresh'
  | 'moons:messages-refresh'
  | 'moons:notifications-refresh';

type Listener = () => void;

const listeners = new Map<RefreshEvent, Set<Listener>>();

export function subscribeRefresh(event: RefreshEvent, listener: Listener) {
  let set = listeners.get(event);
  if (!set) {
    set = new Set();
    listeners.set(event, set);
  }
  set.add(listener);
  return () => {
    set?.delete(listener);
  };
}

export function emitRefresh(event: RefreshEvent) {
  listeners.get(event)?.forEach((listener) => listener());
}
