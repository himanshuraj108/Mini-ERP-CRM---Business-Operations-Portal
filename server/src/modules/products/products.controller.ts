import { Request, Response, NextFunction } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getStockMovements,
} from './products.service';
import {
  ProductQueryInput,
  CreateProductInput,
  UpdateProductInput,
  StockAdjustmentInput,
} from './products.schema';
import { ApiResponse } from '../../types';

export async function listProducts(
  req: Request<object, object, object, ProductQueryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getProducts(req.query);
    const response: ApiResponse = { success: true, data: result };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      const response: ApiResponse = { success: false, error: 'Product not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse = { success: true, data: product };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function createProductHandler(
  req: Request<object, object, CreateProductInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await createProduct(req.body, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product created successfully',
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateProductHandler(
  req: Request<{ id: string }, object, UpdateProductInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await updateProduct(req.params.id, req.body);
    if (!product) {
      const response: ApiResponse = { success: false, error: 'Product not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse = {
      success: true,
      data: product,
      message: 'Product updated successfully',
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteProductHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await deleteProduct(req.params.id);
    if (!deleted) {
      const response: ApiResponse = { success: false, error: 'Product not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse = { success: true, message: 'Product deleted successfully' };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function adjustStockHandler(
  req: Request<{ id: string }, object, StockAdjustmentInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const product = await adjustStock(req.params.id, req.body, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: product,
      message: `Stock ${req.body.movement_type === 'IN' ? 'added' : 'removed'} successfully`,
    };
    res.status(200).json(response);
  } catch (err) {
    if (err instanceof Error && err.message.includes('Insufficient stock')) {
      const response: ApiResponse = { success: false, error: err.message };
      res.status(422).json(response);
      return;
    }
    next(err);
  }
}

export async function getStockMovementsHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const movements = await getStockMovements(req.params.id);
    const response: ApiResponse = { success: true, data: movements };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
