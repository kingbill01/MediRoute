import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getInventory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { hospitalId } = req.params;
  const { category, lowStock } = req.query;

  const items = await prisma.inventoryItem.findMany({
    where: {
      hospitalId,
      ...(category && { category: category as string }),
    },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 5 } },
    orderBy: { name: 'asc' },
  });

  // Flag low stock items and filter if requested
  const withAlerts = items.map(i => ({ ...i, isLowStock: i.quantity <= i.minThreshold }));
  const result = lowStock === 'true' ? withAlerts.filter(i => i.isLowStock) : withAlerts;

  res.json({ success: true, data: result, lowStockCount: withAlerts.filter(i => i.isLowStock).length });
});

export const createInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const item = await prisma.inventoryItem.create({ data: req.body });
  res.status(201).json({ success: true, data: item });
});

export const updateInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { id } = req.params;
  const { name, category, reference, quantity, minThreshold, unit, expiryDate, supplier, unitCost } = req.body;

  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      ...(name        !== undefined && { name }),
      ...(category    !== undefined && { category }),
      ...(reference   !== undefined && { reference }),
      ...(quantity    !== undefined && { quantity: Number(quantity) }),
      ...(minThreshold !== undefined && { minThreshold: Number(minThreshold) }),
      ...(unit        !== undefined && { unit }),
      ...(expiryDate  !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
      ...(supplier    !== undefined && { supplier }),
      ...(unitCost    !== undefined && { unitCost: unitCost !== '' ? Number(unitCost) : null }),
    },
  });
  res.json({ success: true, data: item });
});

export const deleteInventoryItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  await prisma.inventoryItem.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Article supprimé' });
});

export const recordMovement = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  if (!['ADMIN', 'HOSPITAL_ADMIN'].includes(role as string)) throw new AppError('Accès non autorisé', 403);

  const { itemId, type, quantity, reason } = req.body;
  if (!itemId || !type || !quantity) throw new AppError('Champs requis manquants', 400);

  const item = await prisma.inventoryItem.findUnique({ where: { id: itemId } });
  if (!item) throw new AppError('Article non trouvé', 404);

  const delta = ['IN', 'RETURNED'].includes(type) ? quantity : -quantity;
  const newQty = item.quantity + delta;
  if (newQty < 0) throw new AppError('Stock insuffisant', 400);

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({ data: { itemId, type, quantity, reason, performedBy: userId } }),
    prisma.inventoryItem.update({ where: { id: itemId }, data: { quantity: newQty } }),
  ]);

  res.json({ success: true, data: movement, newQuantity: newQty });
});
