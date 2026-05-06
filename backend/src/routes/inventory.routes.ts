import express from 'express';
import {
  getInventory, createInventoryItem, updateInventoryItem,
  deleteInventoryItem, recordMovement,
} from '../controllers/inventory.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();
router.use(authenticate);
router.get('/hospital/:hospitalId', getInventory);
router.post('/',             createInventoryItem);
router.put('/:id',           updateInventoryItem);
router.delete('/:id',        deleteInventoryItem);
router.post('/movement',     recordMovement);
export default router;
