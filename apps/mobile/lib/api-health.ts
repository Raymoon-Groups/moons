import { API_URL } from './api-url';

/** Quick reachability check — hits the lightweight health endpoint. */
export async function checkApiReachable(timeoutMs = 12000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
