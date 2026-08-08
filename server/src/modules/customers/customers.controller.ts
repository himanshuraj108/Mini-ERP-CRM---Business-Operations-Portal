import { Request, Response, NextFunction } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowups,
  addFollowup,
} from './customers.service';
import { CustomerQueryInput, CreateCustomerInput, UpdateCustomerInput, AddFollowupInput } from './customers.schema';
import { ApiResponse } from '../../types';

export async function listCustomers(
  req: Request<object, object, object, CustomerQueryInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await getCustomers(req.query);
    const response: ApiResponse = { success: true, data: result };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getCustomer(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await getCustomerById(req.params.id);
    if (!customer) {
      const response: ApiResponse = { success: false, error: 'Customer not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse = { success: true, data: customer };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function createCustomerHandler(
  req: Request<object, object, CreateCustomerInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await createCustomer(req.body, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: customer,
      message: 'Customer created successfully',
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateCustomerHandler(
  req: Request<{ id: string }, object, UpdateCustomerInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const existing = await getCustomerById(req.params.id);
    if (!existing) {
      const response: ApiResponse = { success: false, error: 'Customer not found' };
      res.status(404).json(response);
      return;
    }

    const customer = await updateCustomer(req.params.id, req.body);
    const response: ApiResponse = {
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteCustomerHandler(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const deleted = await deleteCustomer(req.params.id);
    if (!deleted) {
      const response: ApiResponse = { success: false, error: 'Customer not found' };
      res.status(404).json(response);
      return;
    }
    const response: ApiResponse = { success: true, message: 'Customer deleted successfully' };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listFollowups(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const followups = await getFollowups(req.params.id);
    const response: ApiResponse = { success: true, data: followups };
    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function addFollowupHandler(
  req: Request<{ id: string }, object, AddFollowupInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customer = await getCustomerById(req.params.id);
    if (!customer) {
      const response: ApiResponse = { success: false, error: 'Customer not found' };
      res.status(404).json(response);
      return;
    }

    const followup = await addFollowup(req.params.id, req.body.note, req.user!.userId);
    const response: ApiResponse = {
      success: true,
      data: followup,
      message: 'Follow-up added successfully',
    };
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}
