import { Response, NextFunction } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from './auth';

export const auditLog = (action: string, resource: string) => {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (req.user) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            userRole: req.user.role as string,
            action,
            resource,
            resourceId: req.params.id || req.params.patientId || req.body.patientId,
            ipAddress: req.ip,
            details: JSON.stringify({ method: req.method, path: req.path }),
          },
        });
      }
    } catch { /* ne pas bloquer la requête */ }
    next();
  };
};
