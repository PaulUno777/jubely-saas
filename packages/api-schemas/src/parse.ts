import { z } from "zod";
import { apiErrorEnvelopeSchema } from "./envelope";

export class ApiResponseError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;
  readonly bodyText: string;

  constructor(
    message: string,
    init: { status: number; code?: string; details?: unknown; bodyText: string },
  ) {
    super(message);
    this.name = "ApiResponseError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details;
    this.bodyText = init.bodyText;
  }
}

export function parseJsonUnknown(text: string): unknown {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export function throwFailedApiResponse(json: unknown, httpStatus: number, bodyText: string): never {
  const parsed = apiErrorEnvelopeSchema.safeParse(json);
  if (parsed.success) {
    const { error } = parsed.data;
    throw new ApiResponseError(error.message, {
      status: httpStatus,
      code: error.code,
      details: error.details,
      bodyText,
    });
  }
  throw new ApiResponseError(`HTTP_${httpStatus}`, { status: httpStatus, bodyText });
}

export function parseSuccessData<T>(
  json: unknown,
  envelopeSchema: z.ZodType<{ data: T }>,
  httpStatus: number,
  bodyText: string,
): T {
  const parsed = envelopeSchema.safeParse(json);
  if (!parsed.success) {
    throw new ApiResponseError("invalid_response", { status: httpStatus, bodyText });
  }
  return parsed.data.data;
}
