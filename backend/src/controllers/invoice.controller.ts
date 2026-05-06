import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const generateInvoiceNumber = () => `MR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN', 'DOCTOR'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { patientId, doctorId, hospitalId, appointmentId, items, dueDate, notes, discount = 0, tax = 0 } = req.body;
  if (!patientId || !items?.length) throw new AppError('patientId et items requis', 400);

  const subtotal = items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);
  const total = subtotal + tax - discount;

  const invoice = await prisma.invoice.create({
    data: {
      patientId, doctorId, hospitalId, appointmentId,
      invoiceNumber: generateInvoiceNumber(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      subtotal, tax, discount, total, notes,
      items: { create: items.map((i: any) => ({ ...i, total: i.unitPrice * i.quantity })) },
    },
    include: { items: true },
  });

  res.status(201).json({ success: true, data: invoice });
});

export const getPatientInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { patientId } = req.params;

  if ((role as string) === 'PATIENT' && userId !== patientId) throw new AppError('Accès non autorisé', 403);

  const invoices = await prisma.invoice.findMany({
    where: { patientId },
    include: { items: true },
    orderBy: { issueDate: 'desc' },
  });

  res.json({ success: true, data: invoices });
});

export const updateInvoiceStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { id } = req.params;
  const { status, paymentMethod } = req.body;

  const invoice = await prisma.invoice.update({
    where: { id },
    data: { status, paymentMethod, paidAt: status === 'PAID' ? new Date() : undefined },
    include: { items: true },
  });

  res.json({ success: true, data: invoice });
});
