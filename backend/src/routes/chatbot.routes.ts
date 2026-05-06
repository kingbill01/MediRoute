import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getChatHistory, sendMessage, clearChatHistory } from '../controllers/chatbot.controller';

const router = Router();

router.use(authenticate);

router.get('/history', getChatHistory);
router.post('/message', sendMessage);
router.delete('/history', clearChatHistory);

export default router;
