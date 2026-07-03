import { z } from 'zod'

export const sendInviteSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  promotionId: z.string().optional(),
  goOutStatusId: z.string().optional(),
})
