import { Router, RequestHandler } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  stockAdjustmentSchema,
} from './products.schema';
import {
  listProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  adjustStockHandler,
  getStockMovementsHandler,
} from './products.controller';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin', 'sales', 'warehouse', 'accounts'), validateQuery(productQuerySchema), listProducts as unknown as RequestHandler);
router.post('/', authorize('admin', 'warehouse'), validateBody(createProductSchema), createProductHandler as RequestHandler);
router.get('/:id', authorize('admin', 'sales', 'warehouse', 'accounts'), getProduct as RequestHandler);
router.put('/:id', authorize('admin', 'warehouse'), validateBody(updateProductSchema), updateProductHandler as RequestHandler);
router.delete('/:id', authorize('admin'), deleteProductHandler as RequestHandler);
router.get('/:id/stock-movements', authorize('admin', 'warehouse'), getStockMovementsHandler as RequestHandler);
router.post('/:id/stock', authorize('admin', 'warehouse'), validateBody(stockAdjustmentSchema), adjustStockHandler as RequestHandler);

export default router;
