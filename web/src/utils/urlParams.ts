export function readPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback
}

export function readPageSize(
  value: string | null,
  fallback: number,
  max = 100,
): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max
    ? parsed
    : fallback
}

export function isDateOnly(value: string | null): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function setOrDeleteParam(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  if (value) {
    params.set(key, value)
  } else {
    params.delete(key)
  }
}
