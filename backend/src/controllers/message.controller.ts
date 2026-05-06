import { Response } from 'express';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

// GET /messages/conversations — liste des conversations du user courant
export const getConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user!.userId;

  // Tous les messages impliquant cet utilisateur
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { receiverId: userId }] },
    orderBy: { createdAt: 'desc' },
  });

  // Extraire les interlocuteurs uniques
  const partnerIds = [...new Set(
    messages.map(m => m.senderId === userId ? m.receiverId : m.senderId)
  )];

  if (partnerIds.length === 0) return res.json({ success: true, data: [] });

  const partners = await prisma.user.findMany({
    where: { id: { in: partnerIds } },
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  const conversations = partners.map(p => {
    const thread = messages.filter(
      m => (m.senderId === userId && m.receiverId === p.id) ||
           (m.receiverId === userId && m.senderId === p.id)
    );
    const last = thread[0]; // already desc
    const unread = thread.filter(m => m.receiverId === userId && !m.isRead).length;
    return { partner: p, lastMessage: last, unreadCount: unread };
  }).sort((a, b) =>
    new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  res.json({ success: true, data: conversations });
});

// GET /messages/:partnerId — historique avec un interlocuteur (marque comme lus)
export const getThread = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId    = req.user!.userId;
  const partnerId = req.params.partnerId;

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, firstName: true, lastName: true, role: true },
  });
  if (!partner) throw new AppError('Utilisateur non trouvé', 404);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId,    receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  // Marquer les messages reçus non lus comme lus
  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: userId, isRead: false },
    data: { isRead: true },
  });

  res.json({ success: true, data: messages, partner });
});

// POST /messages — envoyer un message
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const senderId = req.user!.userId;
  const { receiverId, content } = req.body;

  if (!receiverId || !content?.trim()) throw new AppError('receiverId et content requis', 400);

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) throw new AppError('Destinataire non trouvé', 404);

  const message = await prisma.message.create({
    data: { senderId, receiverId, content: content.trim() },
  });

  res.status(201).json({ success: true, data: message });
});

// GET /messages/unread-count — nombre total de messages non lus
export const getUnreadCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await prisma.message.count({
    where: { receiverId: req.user!.userId, isRead: false },
  });
  res.json({ success: true, data: { count } });
});

// GET /messages/contacts — liste des médecins (pour patient) ou patients (pour médecin) à contacter
export const getContacts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId, role } = req.user!;
  const userRole = role as string;

  let contacts: any[] = [];

  if (userRole === 'PATIENT') {
    // Médecins ayant eu un rendez-vous avec ce patient
    const appts = await prisma.appointment.findMany({
      where: { patientId: userId },
      select: { doctorId: true },
      distinct: ['doctorId'],
    });
    const ids = appts.map(a => a.doctorId);
    contacts = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
  } else if (userRole === 'DOCTOR') {
    // Patients ayant eu un rendez-vous avec ce médecin
    const appts = await prisma.appointment.findMany({
      where: { doctorId: userId },
      select: { patientId: true },
      distinct: ['patientId'],
    });
    const ids = appts.map(a => a.patientId);
    contacts = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true, role: true },
    });
  }

  res.json({ success: true, data: contacts });
});
