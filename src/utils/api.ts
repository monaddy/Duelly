export async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit & { timeoutMs?: number }) {
  const { timeoutMs = 4000, ...rest } = init ?? {};
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...rest, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

export async function wildbgGet(path: string) {
  const base = import.meta.env.VITE_WILDBG_URL as string | undefined;
  if (!base) throw new Error('WILDBG_URL not set');
  const res = await fetchWithTimeout(`${base.replace(/\/$/, '')}${path}`, { timeoutMs: 3000 });
  if (!res.ok) throw new Error(`wildbg ${res.status}`);
  return res.json();
}
