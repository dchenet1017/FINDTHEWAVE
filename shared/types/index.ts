/**
 * Shared TypeScript type definitions for WaveFinder
 */

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export * from './business'

export interface WaveLeader {
  id: string
  userId: string
  businessId: string
  role: string
  createdAt: Date
  updatedAt: Date
}

