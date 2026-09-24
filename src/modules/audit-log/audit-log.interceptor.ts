import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url, body, ip, user } = req;
    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && user) {
          const action = `${method} ${url.split('?')[0]}`;
          // Fire and forget
          this.auditLogService.log({
            action,
            performedBy: user.userId,
            details: body,
            ipAddress: ip,
          }).catch(err => console.error('AuditLog error:', err));
        }
      })
    );
  }
}
