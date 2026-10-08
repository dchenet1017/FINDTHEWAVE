import { FastifyReply, FastifyRequest } from 'fastify'
import { successResponse, errorResponse } from '../../../utils/response'
import * as adminDashboardService from './admin-dashboard.service'

/** GET /api/admin/dashboard */
export const getDashboard = async (_request: FastifyRequest, reply: FastifyReply) => {
  try {
    return reply.send(successResponse(await adminDashboardService.getDashboard()))
  } catch (error) {
    console.error('[admin dashboard] failed', error)
    return reply.code(500).send(errorResponse('INTERNAL_ERROR', 'Could not load the dashboard'))
  }
}
