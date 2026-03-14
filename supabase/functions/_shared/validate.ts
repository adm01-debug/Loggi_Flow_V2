/**
 * Lightweight validation helpers for edge functions (no Zod dependency in Deno).
 */

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function requireString(obj: Record<string, unknown>, field: string, opts?: { minLength?: number; maxLength?: number; pattern?: RegExp }): string {
  const val = obj[field];
  if (typeof val !== "string" || val.trim().length === 0) {
    throw new ValidationError(field, `${field} is required and must be a non-empty string`);
  }
  const trimmed = val.trim();
  if (opts?.minLength && trimmed.length < opts.minLength) {
    throw new ValidationError(field, `${field} must be at least ${opts.minLength} characters`);
  }
  if (opts?.maxLength && trimmed.length > opts.maxLength) {
    throw new ValidationError(field, `${field} must be at most ${opts.maxLength} characters`);
  }
  if (opts?.pattern && !opts.pattern.test(trimmed)) {
    throw new ValidationError(field, `${field} has invalid format`);
  }
  return trimmed;
}

export function requireNumber(obj: Record<string, unknown>, field: string, opts?: { min?: number; max?: number }): number {
  const val = Number(obj[field]);
  if (isNaN(val)) {
    throw new ValidationError(field, `${field} is required and must be a number`);
  }
  if (opts?.min !== undefined && val < opts.min) {
    throw new ValidationError(field, `${field} must be >= ${opts.min}`);
  }
  if (opts?.max !== undefined && val > opts.max) {
    throw new ValidationError(field, `${field} must be <= ${opts.max}`);
  }
  return val;
}

export function optionalString(obj: Record<string, unknown>, field: string): string | undefined {
  const val = obj[field];
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val !== "string") throw new ValidationError(field, `${field} must be a string`);
  return val.trim();
}

export function requireEnum<T extends string>(obj: Record<string, unknown>, field: string, values: readonly T[]): T {
  const val = requireString(obj, field);
  if (!values.includes(val as T)) {
    throw new ValidationError(field, `${field} must be one of: ${values.join(", ")}`);
  }
  return val as T;
}

export function validationErrorResponse(err: ValidationError, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: "Validation error", field: err.field, message: err.message }),
    { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
