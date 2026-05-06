import express from 'express';
import {
  getMySubscription, subscribe, cancelSubscription,
  checkUserSubscription, getAllSubscriptions, updateSubscriptionStatus,
} from '../controllers/subscription.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);

router.get('/me',                    getMySubscription);
router.post('/subscribe',            subscribe);
router.post('/cancel',               cancelSubscription);
router.get('/check/:userId',         checkUserSubscription);
router.get('/',                      authorize('ADMIN' as any), getAllSubscriptions);
router.put('/:id/status',            authorize('ADMIN' as any), updateSubscriptionStatus);

export default router;
