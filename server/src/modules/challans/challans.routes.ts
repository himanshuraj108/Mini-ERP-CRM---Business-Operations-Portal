import { Router, RequestHandler } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createChallanSchema, challanQuerySchema } from './challans.schema';
import {
  listChallans,
  getChallan,
  createChallanHandler,
  confirmChallanHandler,
  cancelChallanHandler,
} from './challans.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'sales', 'accounts'), validateQuery(challanQuerySchema), listChallans as unknown as RequestHandler);
router.post('/', authorize('admin', 'sales'), validateBody(createChallanSchema), createChallanHandler as RequestHandler);
router.get('/:id', authorize('admin', 'sales', 'accounts'), getChallan as RequestHandler);
router.patch('/:id/confirm', authorize('admin', 'sales'), confirmChallanHandler as RequestHandler);
router.patch('/:id/cancel', authorize('admin', 'sales'), cancelChallanHandler as RequestHandler);

export default router;
