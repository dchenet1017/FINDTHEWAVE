import type { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { NotFoundError, BadRequestError } from '../../utils/errors'
import { createNotification } from '../notifications/notification.service'
import type { sendInviteSchema } from './invite.schema'

type SendInviteInput = z.infer<typeof sendInviteSchema>

function serializeInvite(row: {
  id: string
  businessId: string
  userId: string
  goOutStatusId: string | null
  promotionId: string | null
  title: string
  message: string
  status: string
  sentAt: Date
  respondedAt: Date | null
}) {
  return {
    id: row.id,
    businessId: row.businessId,
    userId: row.userId,
    goOutStatusId: row.goOutStatusId,
    promotionId: row.promotionId,
    title: row.title,
    message: row.message,
    status: row.status,
    sentAt: row.sentAt.toISOString(),
    respondedAt: row.respondedAt?.toISOString() ?? null,
  }
}

async function businessForUser(userId: string) {
  const business = await prisma.business.findUnique({ where: { userId } })
  if (!business) throw new NotFoundError('Business not found for this user')
  return business
}

export async function sendInvite(businessUserId: string, params: SendInviteInput) {
  const business = await businessForUser(businessUserId)

  if (!params.userId || !params.title || !params.message) {
    throw new BadRequestError('userId, title, and message are required')
  }

  const targetUser = await prisma.user.findUnique({ where: { id: params.userId } })
  if (!targetUser) throw new NotFoundError('User not found')

  const invite = await prisma.businessInvite.create({
    data: {
      businessId: business.id,
      userId: params.userId,
      title: params.title,
      message: params.message,
      promotionId: params.promotionId || null,
      goOutStatusId: params.goOutStatusId || null,
    },
  })

  await createNotification({
    userId: params.userId,
    type: 'business_invite',
    title: params.title,
    message: params.message,
    data: { inviteId: invite.id, businessId: business.id, businessName: business.name },
  })

  return serializeInvite(invite)
}

export async function listSentInvites(businessUserId: string) {
  const business = await businessForUser(businessUserId)
  const rows = await prisma.businessInvite.findMany({
    where: { businessId: business.id },
    orderBy: { sentAt: 'desc' },
    include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
  })
  return rows.map((r) => ({ ...serializeInvite(r), user: r.user }))
}

export async function listReceivedInvites(userId: string) {
  const rows = await prisma.businessInvite.findMany({
    where: { userId },
    orderBy: { sentAt: 'desc' },
    include: { business: { select: { id: true, name: true, images: true } } },
  })
  return rows.map((r) => ({ ...serializeInvite(r), business: r.business }))
}

async function assertRecipient(inviteId: string, userId: string) {
  const invite = await prisma.businessInvite.findFirst({ where: { id: inviteId, userId } })
  if (!invite) throw new NotFoundError('Invite not found')
  return invite
}

export async function acceptInvite(userId: string, inviteId: string) {
  const invite = await assertRecipient(inviteId, userId)
  if (invite.status !== 'SENT' && invite.status !== 'VIEWED') {
    throw new BadRequestError('This invite has already been responded to')
  }
  const row = await prisma.businessInvite.update({
    where: { id: inviteId },
    data: { status: 'ACCEPTED', respondedAt: new Date() },
  })
  return serializeInvite(row)
}

export async function declineInvite(userId: string, inviteId: string) {
  const invite = await assertRecipient(inviteId, userId)
  if (invite.status !== 'SENT' && invite.status !== 'VIEWED') {
    throw new BadRequestError('This invite has already been responded to')
  }
  const row = await prisma.businessInvite.update({
    where: { id: inviteId },
    data: { status: 'DECLINED', respondedAt: new Date() },
  })
  return serializeInvite(row)
}
