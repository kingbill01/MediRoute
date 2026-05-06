import { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database-postgres';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es MediBot, l'assistant santé de MediRoute — une application médicale utilisée au Sénégal.

Tes missions :
- Donner des conseils de santé généraux en français, adaptés au contexte sénégalais (paludisme, fièvre typhoïde, diarrhées, conditions tropicales, etc.)
- Aider les utilisateurs à comprendre leurs symptômes et à décider s'ils doivent consulter un médecin
- Rappeler les gestes de prévention (vaccination, hygiène, alimentation)
- Expliquer les médicaments courants de façon simple
- Orienter vers les services d'urgence en cas de symptômes graves

Règles STRICTES :
- Ne jamais poser de diagnostic définitif — toujours recommander une consultation médicale pour tout symptôme sérieux
- En cas de symptômes critiques (douleur thoracique, difficulté respiratoire, perte de conscience, convulsions, saignement abondant) : recommander IMMÉDIATEMENT les urgences et proposer le formulaire d'urgence MediRoute
- Répondre UNIQUEMENT en français, de façon claire et empathique
- Limiter tes réponses à 3-4 paragraphes maximum
- Ne pas donner de posologies précises de médicaments — toujours dire "selon prescription médicale"
- Commencer toujours ta réponse par une formule empathique

Tu es disponible 24h/24 mais tu n'es pas un médecin. Ton rôle est de conseiller et d'orienter.`;

// ── GET /api/chatbot/history ──────────────────────────────────────────────────
export const getChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  res.json({ success: true, data: messages });
});

// ── POST /api/chatbot/message ─────────────────────────────────────────────────
export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  const { content } = req.body;

  if (!content?.trim()) throw new AppError('Message vide', 400);
  if (content.length > 1000) throw new AppError('Message trop long (max 1000 caractères)', 400);

  // Sauvegarder le message utilisateur
  await prisma.chatMessage.create({
    data: { userId, role: 'user', content: content.trim() },
  });

  // Récupérer l'historique récent pour le contexte (10 derniers échanges)
  const history = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  history.reverse();

  // Construire les messages pour Claude
  const messages: { role: 'user' | 'assistant'; content: string }[] = history.map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  let assistantResponse: string;

  if (process.env.ANTHROPIC_API_KEY) {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    });
    assistantResponse = (response.content[0] as { type: string; text: string }).text;
  } else {
    // Mode dégradé sans clé API
    assistantResponse = getDegradedResponse(content);
  }

  // Sauvegarder la réponse
  const saved = await prisma.chatMessage.create({
    data: { userId, role: 'assistant', content: assistantResponse },
  });

  res.json({ success: true, data: { message: saved } });
});

// ── DELETE /api/chatbot/history ───────────────────────────────────────────────
export const clearChatHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { userId } = req.user!;
  await prisma.chatMessage.deleteMany({ where: { userId } });
  res.json({ success: true, message: 'Historique effacé' });
});

// ── Réponses dégradées si pas de clé API ─────────────────────────────────────
function getDegradedResponse(question: string): string {
  const q = question.toLowerCase();

  if (q.includes('fièvre') || q.includes('temperature') || q.includes('chaud')) {
    return `Je comprends votre inquiétude concernant la fièvre. La fièvre est souvent le signe que le corps combat une infection.\n\n**Que faire :** Reposez-vous, hydratez-vous abondamment (eau, jus, tisanes), et prenez du paracétamol selon la posologie recommandée par votre médecin. Surveillez la température régulièrement.\n\n**Consultez un médecin si :** la fièvre dépasse 39,5°C, persiste plus de 3 jours, s'accompagne de frissons intenses ou de confusion. Au Sénégal, une fièvre peut être liée au paludisme — un test rapide est recommandé.\n\n⚠️ En cas de symptômes graves, utilisez le formulaire d'urgence MediRoute.`;
  }

  if (q.includes('paludisme') || q.includes('malaria') || q.includes('moustique')) {
    return `Le paludisme est une maladie grave transmise par les moustiques, très présente au Sénégal, surtout en saison des pluies.\n\n**Symptômes classiques :** fièvre cyclique, frissons, maux de tête, fatigue intense, douleurs musculaires.\n\n**En cas de suspicion :** consultez immédiatement un médecin pour un test de diagnostic rapide (TDR). Ne prenez pas de traitement antipaludéen sans prescription médicale.\n\n**Prévention :** dormez sous moustiquaire imprégnée, utilisez des répulsifs, et éliminez les eaux stagnantes autour de chez vous.`;
  }

  if (q.includes('diarrhée') || q.includes('ventre') || q.includes('gastro')) {
    return `Les troubles digestifs peuvent avoir plusieurs causes : intoxication alimentaire, infection virale ou bactérienne, ou parasites.\n\n**Actions immédiates :** Buvez beaucoup de liquides pour éviter la déshydratation. Les sels de réhydratation orale (SRO) sont très efficaces et disponibles dans toutes les pharmacies.\n\n**Alimentation :** Optez pour des aliments faciles à digérer (riz, bananes, bouillons).\n\n**Consultez un médecin si :** la diarrhée dure plus de 48h, s'accompagne de sang, de fièvre élevée, ou chez un enfant de moins de 5 ans — la déshydratation peut être dangereuse.`;
  }

  if (q.includes('mal de tête') || q.includes('migraine') || q.includes('céphalée')) {
    return `Les maux de tête sont très fréquents et peuvent avoir de nombreuses causes : stress, fatigue, déshydratation, hypertension, ou infection.\n\n**Conseils immédiats :** Reposez-vous dans un endroit calme et sombre, hydratez-vous bien, appliquez une compresse fraîche sur le front. Le paracétamol peut aider selon prescription.\n\n**Consultez un médecin si :** le mal de tête est brutal et intense ("comme un coup de tonnerre"), s'accompagne de fièvre élevée et raideur de nuque, de troubles visuels, ou de vomissements. Ces signes peuvent indiquer une urgence neurologique.`;
  }

  if (q.includes('grossesse') || q.includes('enceinte') || q.includes('bébé')) {
    return `Félicitations ! La santé pendant la grossesse est très importante. Je vous conseille de suivre attentivement vos consultations prénatales.\n\n**Recommandations :** Prenez de l'acide folique (selon prescription), évitez l'automédication, maintenez une alimentation équilibrée riche en fer et en calcium, et dormez suffisamment.\n\n**Consultez immédiatement en cas de :** saignements, douleurs abdominales intenses, maux de tête sévères avec gonflement du visage et des mains (prééclampsie), ou absence de mouvements fœtaux.\n\n⚠️ Pour toute urgence obstétricale, utilisez le formulaire d'urgence MediRoute.`;
  }

  return `Merci pour votre question. Je suis MediBot, votre assistant santé MediRoute.\n\nBien que je sois là pour vous donner des conseils généraux, **il est important de consulter un médecin** pour un diagnostic précis adapté à votre situation.\n\nEn attendant votre consultation, reposez-vous bien, hydratez-vous suffisamment, et évitez l'automédication sans avis médical.\n\n🏥 Vous pouvez prendre rendez-vous directement depuis votre espace patient MediRoute, ou utiliser le formulaire d'urgence si vos symptômes sont graves.`;
}
