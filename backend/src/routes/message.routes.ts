import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getConversations,
  getThread,
  sendMessage,
  getUnreadCount,
  getContacts,
} from '../controllers/message.controller';

const router = express.Router();
router.use(authenticate);

router.get('/conversations', getConversations);
router.get('/unread-count',  getUnreadCount);
router.get('/contacts',      getContacts);
router.get('/:partnerId',    getThread);
router.post('/',             sendMessage);

export default router;
