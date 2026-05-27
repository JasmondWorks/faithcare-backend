import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedPayload {
  data: unknown[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

function isPaginated(value: unknown): value is PaginatedPayload {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.data) &&
    v.meta !== null &&
    typeof v.meta === 'object' &&
    typeof (v.meta as Record<string, unknown>).total === 'number' &&
    typeof (v.meta as Record<string, unknown>).totalPages === 'number'
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        // Responses that already carry a `success` key are passed through unchanged.
        // This preserves auth service responses (which include tokens, messages, etc.)
        // and any other hand-crafted responses that are intentionally structured.
        if (
          value !== null &&
          typeof value === 'object' &&
          'success' in (value as object)
        ) {
          return value;
        }

        // Paginated list response from BaseRepository.paginate()
        if (isPaginated(value)) {
          return { success: true, data: value.data, meta: value.meta };
        }

        // Plain value — single record, primitive, null, or plain object
        return { success: true, data: value ?? null };
      }),
    );
  }
}
