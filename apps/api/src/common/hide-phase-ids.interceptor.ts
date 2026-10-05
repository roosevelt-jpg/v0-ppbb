import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { hidePhaseIdsInCopyFields } from './ui-copy';

/**
 * Strip internal VL-### phase IDs from user-facing note/notes/description fields
 * on every JSON API response so consoles never show library numbering.
 */
@Injectable()
export class HidePhaseIdsInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => hidePhaseIdsInCopyFields(data)));
  }
}
