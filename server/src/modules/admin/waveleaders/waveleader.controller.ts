import { FastifyRequest, FastifyReply } from 'fastify'
import * as waveLeaderService from './waveleader.service'
import { successResponse } from '../../../utils/response'

interface WaveLeaderQuery {
  page?: string
  limit?: string
  search?: string
  status?: 'all' | 'pending' | 'verified' | 'suspended'
  specialty?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface WaveLeaderParams {
  id: string
}

// GET /admin/waveleaders
export const getWaveLeaders = async (request: FastifyRequest, reply: FastifyReply) => {
  const { 
    page = '1', 
    limit = '10', 
    search, 
    status = 'all',
    specialty,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = request.query as WaveLeaderQuery

  const result = await waveLeaderService.getWaveLeaders({
    page: Number(page),
    limit: Number(limit),
    search,
    status,
    specialty,
    sortBy,
    sortOrder,
  })

  return reply.send(successResponse(result))
}

// GET /admin/waveleaders/:id
export const getWaveLeader = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as WaveLeaderParams
  const waveLeader = await waveLeaderService.getWaveLeaderById(id)
  return reply.send(successResponse(waveLeader))
}

// PATCH /admin/waveleaders/:id
export const updateWaveLeader = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as WaveLeaderParams
  const data = request.body as any
  const waveLeader = await waveLeaderService.updateWaveLeader(id, data)
  return reply.send(successResponse(waveLeader))
}

// POST /admin/waveleaders/:id/verify
export const verifyWaveLeader = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as WaveLeaderParams
  const waveLeader = await waveLeaderService.verifyWaveLeader(id)
  return reply.send(successResponse(waveLeader))
}

// POST /admin/waveleaders/:id/suspend
export const suspendWaveLeader = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as WaveLeaderParams
  const waveLeader = await waveLeaderService.suspendWaveLeader(id)
  return reply.send(successResponse(waveLeader))
}

// POST /admin/waveleaders/:id/activate
export const activateWaveLeader = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as WaveLeaderParams
  const waveLeader = await waveLeaderService.activateWaveLeader(id)
  return reply.send(successResponse(waveLeader))
}

// DELETE /admin/waveleaders/:id
export const deleteWaveLeader = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as WaveLeaderParams
  await waveLeaderService.deleteWaveLeader(id)
  return reply.send(successResponse({ message: 'WaveLeader deleted successfully' }))
}
