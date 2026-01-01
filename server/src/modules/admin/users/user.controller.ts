import { FastifyRequest, FastifyReply } from 'fastify'
import * as userService from './user.service'
import { successResponse } from '../../../utils/response'
import {
  getUsersQuerySchema,
  updateUserSchema,
  changeRoleSchema,
  bulkActionSchema,
} from './user.schema'

// GET /admin/users
export const getUsers = async (request: FastifyRequest, reply: FastifyReply) => {
  const {
    page = '1',
    limit = '10',
    search,
    role,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = request.query as any

  // Validate query params
  const validated = getUsersQuerySchema.parse({
    page,
    limit,
    search,
    role,
    status,
    sortBy,
    sortOrder,
  })

  const result = await userService.getUsers({
    page: Number(validated.page),
    limit: Number(validated.limit),
    search: validated.search,
    role: validated.role,
    status: validated.status,
    sortBy: validated.sortBy,
    sortOrder: validated.sortOrder,
  })

  return reply.send(successResponse(result))
}

// GET /admin/users/:id
export const getUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const user = await userService.getUserById(id)
  return reply.send(successResponse(user))
}

// PATCH /admin/users/:id
export const updateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const data = updateUserSchema.parse(request.body)
  const user = await userService.updateUser(id, data)
  return reply.send(successResponse(user))
}

// DELETE /admin/users/:id
export const deleteUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  await userService.deleteUser(id)
  return reply.send(successResponse({ message: 'User deleted successfully' }))
}

// POST /admin/users/:id/suspend
export const suspendUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const user = await userService.suspendUser(id)
  return reply.send(successResponse(user))
}

// POST /admin/users/:id/activate
export const activateUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const user = await userService.activateUser(id)
  return reply.send(successResponse(user))
}

// POST /admin/users/:id/verify
export const verifyUser = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const user = await userService.verifyUser(id)
  return reply.send(successResponse(user))
}

// POST /admin/users/:id/change-role
export const changeUserRole = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string }
  const { role } = changeRoleSchema.parse(request.body)
  const user = await userService.changeUserRole(id, role)
  return reply.send(successResponse(user))
}

// POST /admin/users/bulk
export const bulkAction = async (request: FastifyRequest, reply: FastifyReply) => {
  const { action, userIds } = bulkActionSchema.parse(request.body)
  const result = await userService.bulkAction(action, userIds)
  return reply.send(successResponse(result))
}

