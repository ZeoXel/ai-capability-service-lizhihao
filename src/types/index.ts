export interface CapabilityRequest {
  capability: string;
  input: Record<string, unknown>;
  request_id?: string;
}

export interface SuccessResponse {
  ok: true;
  data: { result: unknown };
  meta: ResponseMeta;
}

export interface ErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
  meta: ResponseMeta;
}

export interface ResponseMeta {
  request_id: string;
  capability: string;
  elapsed_ms: number;
}

export type CapabilityResponse = SuccessResponse | ErrorResponse;

export interface CapabilityHandler {
  name: string;
  description: string;
  validate(input: Record<string, unknown>): void;
  execute(input: Record<string, unknown>): Promise<{ result: unknown }>;
}
