// src/lib/result.ts
interface Ok<T> {
  ok: true;
  data: T;
}

interface Err {
  ok: false;
  error: { code: string; message: string };
}

type Result<T> = Ok<T> | Err;

export const ok = <T>(data: T): Ok<T> => ({ ok: true, data });
export const err = (error: { code: string; message: string }): Err => ({ ok: false, error });
export type { Result, Ok, Err };