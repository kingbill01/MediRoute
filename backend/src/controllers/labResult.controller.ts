import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const createLabResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  if (!['DOCTOR', 'ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { patientId, testName, testCategory, laboratory, results, interpretation, critical, medicalRecordId } = req.body;
  if (!patientId || !testName || !results) throw new AppError('Champs requis manquants', 400);

  const lab = await prisma.labResult.create({
    data: {
      patientId,
      requestedById: userId,
      medicalRecordId,
      testName,
      testCategory: testCategory || 'AUTRE',
      laboratory,
      results: typeof results === 'string' ? results : JSON.stringify(results),
      interpretation,
      critical: critical || false,
      status: 'RECEIVED',
      resultDate: new Date(),
    },
  });

  // If critical, log audit
  if (critical) {
    await prisma.auditLog.create({
      data: {
        userId,
        userRole: role as string,
        action: 'CRITICAL_LAB_RESULT',
        resource: 'lab_result',
        resourceId: lab.id,
        details: JSON.stringify({ patientId, testName }),
      },
    });
  }

  res.status(201).json({ success: true, data: lab });
});

export const getPatientLabResults = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { patientId } = req.params;

  if ((role as string) === 'PATIENT' && userId !== patientId) throw new AppError('Accès non autorisé', 403);

  const labs = await prisma.labResult.findMany({
    where: { patientId },
    orderBy: { requestedAt: 'desc' },
  });

  // Parse JSON results
  const parsed = labs.map(l => ({
    ...l,
    results: (() => { try { return JSON.parse(l.results); } catch { return []; } })(),
  }));

  res.json({ success: true, data: parsed });
});

export const updateLabResult = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['DOCTOR', 'ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { id } = req.params;
  const { results, interpretation, status, critical } = req.body;

  const updated = await prisma.labResult.update({
    where: { id },
    data: {
      ...(results && { results: typeof results === 'string' ? results : JSON.stringify(results) }),
      ...(interpretation && { interpretation }),
      ...(status && { status }),
      ...(critical !== undefined && { critical }),
      resultDate: new Date(),
    },
  });

  res.json({ success: true, data: updated });
});
