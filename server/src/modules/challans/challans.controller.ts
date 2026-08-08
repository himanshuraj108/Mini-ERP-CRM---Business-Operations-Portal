import { Request, Response, NextFunction } from 'express';
import {
  getChallans,
  getChallanById,
  createChallan,
  confirmChallan,
  cancelChallan,
} from './challans.service';
import { ChallanQueryInput, CreateChallanInput } from './challans.schema';
import { ApiResponse } from '../../types';

export async function listChallans(
  req: Request<object, object, object, ChallanQueryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getChallans(req.query);
    const response: ApiResponse = { success: true, data: result };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getChallan(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const challan = await getChallanById(req.params.id);
    if (!challan) {
      const response: ApiResponse = { success: false, error: 'Challan not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse = { success: true, data: challan };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function createChallanHandler(
  req: Request<object, object, CreateChallanInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const challan = await createChallan(req.body, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: challan,
      message: 'Challan created successfully',
    };
    res.status(201).json(response);
  } catch (err) {
    if (err instanceof Error && (err.message.includes('Insufficient stock') || err.message.includes('not found'))) {
      const response: ApiResponse = { success: false, error: err.message };
      res.status(422).json(response);
      return;
    }
    next(err);
  }
}

export async function confirmChallanHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const challan = await confirmChallan(req.params.id, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: challan,
      message: 'Challan confirmed. Stock has been deducted.',
    };
    res.status(200).json(response);
  } catch (err) {
    if (err instanceof Error && (
      err.message.includes('Insufficient stock') ||
      err.message.includes('already') ||
      err.message.includes('not found')
    )) {
      const response: ApiResponse = { success: false, error: err.message };
      res.status(422).json(response);
      return;
    }
    next(err);
  }
}

export async function cancelChallanHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const challan = await cancelChallan(req.params.id, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: challan,
      message: 'Challan cancelled. Stock has been restored.',
    };
    res.status(200).json(response);
  } catch (err) {
    if (err instanceof Error && (err.message.includes('already') || err.message.includes('not found'))) {
      const response: ApiResponse = { success: false, error: err.message };
      res.status(422).json(response);
      return;
    }
    next(err);
  }
}
