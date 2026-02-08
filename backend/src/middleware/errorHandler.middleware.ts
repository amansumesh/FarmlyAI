import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import mongoose from 'mongoose';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ApiError extends Error implements AppError {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

interface MongoError extends mongoose.Error {
  code?: number;
  keyPattern?: Record<string, number>;
}

const handleMongooseError = (error: mongoose.Error): { statusCode: number; message: string } => {
  if (error instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(error.errors).map((err) => err.message);
    return {
      statusCode: 400,
      message: `Validation Error: ${messages.join(', ')}`,
    };
  }

  if (error instanceof mongoose.Error.CastError) {
    return {
      statusCode: 400,
      message: `Invalid ${error.path}: ${error.value}`,
    };
  }

  const mongoErr = error as MongoError;
  if (mongoErr.code === 11000) {
    const field = Object.keys(mongoErr.keyPattern || {})[0];
    return {
      statusCode: 409,
      message: `${field} already exists`,
    };
  }

  return {
    statusCode: 500,
    message: 'Database operation failed',
  };
};

interface ValidationError {
  field: string;
  message: string;
}

const handleZodError = (error: ZodError): { statusCode: number; message: string; errors: ValidationError[] } => {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    statusCode: 400,
    message: 'Validation failed',
    errors,
  };
};

export const errorHandler = (
  err: AppError | mongoose.Error | ZodError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors: ValidationError[] | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    const zodError = handleZodError(err);
    statusCode = zodError.statusCode;
    message = zodError.message;
    errors = zodError.errors;
  } else if (err instanceof mongoose.Error) {
    const mongoError = handleMongooseError(err);
    statusCode = mongoError.statusCode;
    message = mongoError.message;
  } else if ('statusCode' in err && err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  } else {
    message = err.message || message;
  }

  logger.error('Error occurred:', {
    statusCode,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId,
  });

  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Something went wrong. Please try again later.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> | void;

export const asyncHandler = (fn: AsyncRequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
