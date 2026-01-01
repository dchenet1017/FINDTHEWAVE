export enum BusinessType {
  BAR = 'BAR',
  RESTAURANT = 'RESTAURANT',
  ENTERTAINMENT = 'ENTERTAINMENT',
  FITNESS = 'FITNESS',
  WELLNESS = 'WELLNESS',
  HOTEL = 'HOTEL',
  OTHER = 'OTHER',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface BusinessLocation {
  address: string
  city: string
  state: string
  zipCode: string
  latitude: number
  longitude: number
}

export interface Promotion {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Business {
  id: string
  name: string
  description?: string
  type: BusinessType
  approvalStatus: ApprovalStatus
  isActive: boolean
  isVerified: boolean
  phone?: string | null
  email?: string | null
  website?: string | null
  images: string[]
  location: BusinessLocation
  userId: string
  user?: {
    id: string
    email: string
    firstName?: string | null
    lastName?: string | null
    avatar?: string | null
  }
  promotions?: Promotion[]
  createdAt: string
  updatedAt: string
  // Aggregates
  _count?: {
    promotions?: number
    bookings?: number
    checkIns?: number
  }
}

export interface BusinessFilters {
  search?: string
  types?: BusinessType[] | BusinessType | ''
  status?: ApprovalStatus | ''
  city?: string
  state?: string
  minRating?: number
  maxRating?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface CreateBusinessInput {
  name: string
  description?: string
  type: BusinessType
  location: BusinessLocation
  phone?: string
  email?: string
  website?: string
  images?: string[]
}

export interface UpdateBusinessInput extends Partial<CreateBusinessInput> {
  approvalStatus?: ApprovalStatus
  isActive?: boolean
  isVerified?: boolean
}

export interface NearbyBusinessQuery {
  latitude: number
  longitude: number
  radiusMiles?: number
  types?: BusinessType[]
}

