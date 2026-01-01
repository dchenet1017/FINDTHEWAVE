import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ValidationError } from '../utils/errors'
import { errorResponse } from '../utils/response'

interface ValidatedRequest extends FastifyRequest {
  validatedBody?: any
  validatedParams?: any
  validatedQuery?: any
}

/**
 * Zod validation middleware for Fastify
 * Validates body, params, and query against schemas
 */
export const validate = (schema: {
  body?: z.ZodSchema
  params?: z.ZodSchema
  query?: z.ZodSchema
}) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const validatedRequest = request as ValidatedRequest

    try {
      // Validate body if schema provided
      if (schema.body) {
        const body = request.body as any
        validatedRequest.validatedBody = schema.body.parse(body)
      }

      // Validate params if schema provided
      if (schema.params) {
        const params = request.params as any
        validatedRequest.validatedParams = schema.params.parse(params)
      }

      // Validate query if schema provided
      if (schema.query) {
        const query = request.query as any
        validatedRequest.validatedQuery = schema.query.parse(query)
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errorDetails = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }))

        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errorDetails,
          },
        })
      }

      return reply.code(400).send(
        errorResponse('VALIDATION_ERROR', 'Validation failed')
      )
    }
  }
}

