import { FastifyRequest, FastifyReply } from 'fastify'
import * as businessService from './business.service'
import { successResponse } from '../../../utils/response'
import {
  getBusinessesQuerySchema,
  approveBusinessSchema,
  rejectBusinessSchema,
} from './business.schema'
import { AuthenticatedRequest } from '../../../middleware/authenticate'

// GET /admin/businesses
export const getBusinesses = async (request: FastifyRequest, reply: FastifyReply) => {
  const {
    page = '1',
    limit = '10',
    search,
    type,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = request.query as any

  const validated = getBusinessesQuerySchema.parse({
    page,
    limit,
    search,
    type,
    status,
    sortBy,
    sortOrder,
  })

  const result = await businessService.getBusinesses({
    page: Number(validated.page),
    limit: Number(validated.limit),
    search: validated.search,
    type: validated.type,
    status: validated.status,
    sortBy: validated.sortBy,
    sortOrder: validated.sortOrder,
  })

  return reply.send(successResponse(result))
}

// GET /admin/businesses/:id
export const getBusiness = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const business = await businessService.getBusinessById(id)
  return reply.send(successResponse(business))
}

// PATCH /admin/businesses/:id
export const updateBusiness = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const data = request.body as any
  const business = await businessService.updateBusiness(id, data)
  return reply.send(successResponse(business))
}

// POST /admin/businesses/:id/approve
export const approveBusiness = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const { notes } = approveBusinessSchema.parse(request.body)
  const adminId = (request as AuthenticatedRequest).user.userId
  const business = await businessService.approveBusiness(id, adminId, notes)
  return reply.send(successResponse(business))
}

// POST /admin/businesses/:id/reject
export const rejectBusiness = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const { reason, notes } = rejectBusinessSchema.parse(request.body)
  const adminId = (request as AuthenticatedRequest).user.userId
  const business = await businessService.rejectBusiness(id, reason, adminId, notes)
  return reply.send(successResponse(business))
}

// DELETE /admin/businesses/:id
export const deleteBusiness = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  await businessService.deleteBusiness(id)
  return reply.send(successResponse({ message: 'Business deleted successfully' }))
}


