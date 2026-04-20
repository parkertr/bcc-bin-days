import type { LookupResponse } from "./types";

const BASE = "";

export async function lookupBins(params: {
  suburb: string;
  street: string;
  number?: string;
}): Promise<LookupResponse> {
  const q = new URLSearchParams({
    suburb: params.suburb,
    street: params.street,
    ...(params.number ? { number: params.number } : {}),
  });
  const res = await fetch(`${BASE}/bins?${q}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchSuburbs(q: string): Promise<string[]> {
  const res = await fetch(`${BASE}/suburbs?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const body = await res.json();
  return body.suburbs ?? [];
}

export async function fetchStreets(suburb: string, q: string): Promise<string[]> {
  const res = await fetch(
    `${BASE}/streets?suburb=${encodeURIComponent(suburb)}&q=${encodeURIComponent(q)}`
  );
  if (!res.ok) return [];
  const body = await res.json();
  return body.streets ?? [];
}
