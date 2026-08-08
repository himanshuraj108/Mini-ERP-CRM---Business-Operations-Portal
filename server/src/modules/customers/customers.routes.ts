import { Router, RequestHandler } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerQuerySchema,
  addFollowupSchema,
} from './customers.schema';
import {
  listCustomers,
  getCustomer,
  createCustomerHandler,
  updateCustomerHandler,
  deleteCustomerHandler,
  listFollowups,
  addFollowupHandler,
} from './customers.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'sales'), validateQuery(customerQuerySchema), listCustomers as unknown as RequestHandler);
router.post('/', authorize('admin', 'sales'), validateBody(createCustomerSchema), createCustomerHandler as RequestHandler);
router.get('/:id', authorize('admin', 'sales'), getCustomer as RequestHandler);
router.put('/:id', authorize('admin', 'sales'), validateBody(updateCustomerSchema), updateCustomerHandler as RequestHandler);
router.delete('/:id', authorize('admin'), deleteCustomerHandler as RequestHandler);
router.get('/:id/followups', authorize('admin', 'sales'), listFollowups as RequestHandler);
router.post('/:id/followups', authorize('admin', 'sales'), validateBody(addFollowupSchema), addFollowupHandler as RequestHandler);

export default router;
