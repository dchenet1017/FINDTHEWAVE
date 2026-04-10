import { z } from 'zod'

export const waveLeaderRegistrationSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  specialty: z.string().min(1, 'Specialty is required'),
  phone: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  profilePhoto: z.string().optional(),
  hourlyRate: z.number().min(0, 'Hourly rate must be 0 or greater'),
  minDuration: z.number().optional(),
  services: z.array(z.string()).optional(),
  location: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  serviceRadius: z.number().optional(),
  willingToTravel: z.boolean().optional(),
  portfolioImages: z.array(z.string()).optional(),
  portfolioLinks: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  communities: z.array(z.string()).optional(),
})

export type WaveLeaderRegistrationInput = z.infer<typeof waveLeaderRegistrationSchema>
