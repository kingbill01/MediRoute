import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const PLANS: Record<string, { amount: number; label: string }> = {
  PATIENT: { amount: 5000,  label: 'Patient — 5 000 FCFA / an' },
  DOCTOR:  { amount: 15000, label: 'Médecin — 15 000 FCFA / an' },
};

const generateSubNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MR-${year}-${rand}`;
};

const addOneYear = (from: Date = new Date()): Date => {
  const d = new Date(from);
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

// ── Middleware : vérifier souscription active ─────────────────────────────────
export const requireSubscription = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!;
    // Admins et hospital-admins sont exemptés
    if (['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) return next();

    const sub = await prisma.subscription.findUnique({ where: { userId } });
    if (!sub || sub.status !== 'ACTIVE' || !sub.endDate || sub.endDate < new Date()) {
      res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Une souscription active est requise pour accéder à cette fonctionnalité.',
        plans: PLANS,
      });
      return;
    }
    next();
  }
);

// ── GET /api/subscriptions/me ─────────────────────────────────────────────────
export const getMySubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    include: { user: { select: { email: true, firstName: true, lastName: true, role: true } } },
  });

  const isActive = sub?.status === 'ACTIVE' && sub?.endDate && sub.endDate > new Date();
  const daysLeft = sub?.endDate
    ? Math.max(0, Math.floor((sub.endDate.getTime() - Date.now()) / 86400000))
    : 0;

  res.json({
    success: true,
    data: sub ? { ...sub, isActive, daysLeft } : null,
    plans: PLANS,
  });
});

// ── POST /api/subscriptions/subscribe ────────────────────────────────────────
export const subscribe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { paymentMethod, paymentReference, autoRenew = false } = req.body;

  const planKey = (role as string) === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
  const plan = PLANS[planKey];
  if (!plan) throw new AppError('Rôle non éligible à la souscription', 400);

  const validMethods = ['ORANGE_MONEY', 'WAVE', 'CARD', 'APPLE_PAY', 'GOOGLE_PAY'];
  if (!validMethods.includes(paymentMethod)) {
    throw new AppError('Méthode de paiement invalide', 400);
  }

  // Simuler la vérification du paiement (en prod: appel API Orange Money/Wave/Stripe)
  const paymentSuccess = true; // Simulation — toujours réussit
  if (!paymentSuccess) throw new AppError('Échec du paiement', 402);

  const now       = new Date();
  const existing  = await prisma.subscription.findUnique({ where: { userId } });

  // Calculer la date de début : si déjà actif, prolonger depuis la date d'expiration
  const startDate = existing?.status === 'ACTIVE' && existing.endDate && existing.endDate > now
    ? existing.endDate
    : now;
  const endDate   = addOneYear(startDate);

  let history: any[] = [];
  if (existing?.renewalHistory) {
    try { history = JSON.parse(existing.renewalHistory); } catch { history = []; }
  }
  history.push({
    date: now.toISOString(),
    paymentMethod,
    amount: plan.amount,
    reference: paymentReference || null,
  });

  const subNumber = existing?.subscriptionNumber || generateSubNumber();

  const sub = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      plan: planKey,
      status: 'ACTIVE',
      subscriptionNumber: subNumber,
      amount: plan.amount,
      currency: 'FCFA',
      paymentMethod,
      paymentReference: paymentReference || null,
      paymentStatus: 'SUCCESS',
      startDate: now,
      endDate,
      autoRenew,
      renewalHistory: JSON.stringify(history),
    },
    update: {
      status: 'ACTIVE',
      paymentMethod,
      paymentReference: paymentReference || null,
      paymentStatus: 'SUCCESS',
      startDate,
      endDate,
      autoRenew,
      renewalHistory: JSON.stringify(history),
    },
  });

  res.json({
    success: true,
    message: 'Souscription activée avec succès',
    data: {
      subscriptionNumber: sub.subscriptionNumber,
      plan: planKey,
      amount: plan.amount,
      currency: 'FCFA',
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: 'ACTIVE',
      paymentMethod,
    },
  });
});

// ── POST /api/subscriptions/cancel ───────────────────────────────────────────
export const cancelSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) throw new AppError('Aucune souscription trouvée', 404);

  await prisma.subscription.update({
    where: { userId },
    data: { status: 'CANCELLED', autoRenew: false },
  });

  res.json({ success: true, message: 'Souscription annulée. Accès maintenu jusqu\'à expiration.' });
});

// ── GET /api/subscriptions/check/:userId ─────────────────────────────────────
// Vérifie si un autre utilisateur a une souscription active (pour rendez-vous / messages)
export const checkUserSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId: targetId } = req.params;
  const sub = await prisma.subscription.findUnique({ where: { userId: targetId } });
  const isActive = sub?.status === 'ACTIVE' && sub?.endDate && sub.endDate > new Date();
  res.json({ success: true, data: { isActive, status: sub?.status ?? 'NONE' } });
});

// ── GET /api/subscriptions (admin) ───────────────────────────────────────────
export const getAllSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { status, plan, page = '1', limit = '20' } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (status) where.status = status;
  if (plan)   where.plan   = plan;

  const [subs, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      include: { user: { select: { email: true, firstName: true, lastName: true, role: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.subscription.count({ where }),
  ]);

  const revenue = await prisma.subscription.aggregate({
    where: { paymentStatus: 'SUCCESS' },
    _sum: { amount: true },
  });

  res.json({
    success: true,
    data: subs,
    total,
    page: Number(page),
    revenue: revenue._sum.amount ?? 0,
  });
});

// ── PUT /api/subscriptions/:id/status (admin) ────────────────────────────────
export const updateSubscriptionStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { status } = req.body;
  const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'];
  if (!validStatuses.includes(status)) throw new AppError('Statut invalide', 400);

  const sub = await prisma.subscription.update({
    where: { id: req.params.id },
    data: { status },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });

  res.json({ success: true, message: 'Statut mis à jour', data: sub });
});
