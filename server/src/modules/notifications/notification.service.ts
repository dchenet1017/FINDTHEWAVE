import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { NotFoundError } from '../../utils/errors'

function serializeNotification(row: {
  id: string
  userId: string
  type: string
  title: string
  message: string
  data: unknown
  isRead: boolean
  createdAt: Date
}) {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    title: row.title,
    message: row.message,
    data: row.data ?? null,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function listNotifications(userId: string, limit = 50) {
  const rows = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } })
  return { items: rows.map(serializeNotification), unreadCount }
}

export async function markRead(userId: string, notificationId: string) {
  const row = await prisma.notification.findFirst({ where: { id: notificationId, userId } })
  if (!row) throw new NotFoundError('Notification not found')
  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  })
  return serializeNotification(updated)
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
  return { success: true }
}

/** Internal helper for other modules to fire a notification (no HTTP route). */
export async function createNotification(params: {
  userId: string
  type: string
  title: string
  message: string
  data?: Record<string, unknown>
}) {
  const row = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: (params.data ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  })
  return serializeNotification(row)
}
