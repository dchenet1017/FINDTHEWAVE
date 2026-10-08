// Global error handler for Fastify
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { AppError } from '../utils/errors'
import { errorResponse } from '../utils/response'

export const errorHandler = (
  error: FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error(error)
  }

  // Handle known AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send(
      errorResponse(error.code, error.message)
    )
  }

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return reply.status(409).send(
      errorResponse('CONFLICT', 'Resource already exists')
    )
  }

  // Handle validation errors
  if (error.validation) {
    return reply.status(400).send(
      errorResponse('VALIDATION_ERROR', error.message)
    )
  }

  // Client errors raised by Fastify or its plugins (malformed JSON, body too
  // large, rate limited...) carry their own 4xx status - don't turn them into 500s
  const status = (error as FastifyError).statusCode
  if (status && status >= 400 && status < 500) {
    const code = status === 429 ? 'RATE_LIMITED' : (error as FastifyError).code || 'BAD_REQUEST'
    return reply.status(status).send(errorResponse(code, error.message))
  }

  // Default server error
  return reply.status(500).send(
    errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
  )
}

