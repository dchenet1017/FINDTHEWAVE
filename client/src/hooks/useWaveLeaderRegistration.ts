import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/axios'

const STORAGE_KEY = 'waveleader-registration-draft'

export interface WaveLeaderRegistrationData {
  displayName: string
  specialty: string
  phone: string
  description: string
  profilePhoto?: string
  hourlyRate: number
  minDuration: number
  services: string[]
  location: { address: string; latitude: number; longitude: number } | null
  serviceRadius: number
  willingToTravel: boolean
  portfolioImages: string[]
  portfolioLinks: string[]
  certifications: string[]
  communities: string[]
}

const defaultFormData: WaveLeaderRegistrationData = {
  displayName: '',
  specialty: '',
  phone: '',
  description: '',
  hourlyRate: 0,
  minDuration: 60,
  services: [],
  location: null,
  serviceRadius: 10,
  willingToTravel: false,
  portfolioImages: [],
  portfolioLinks: [],
  certifications: [],
  communities: [],
}

function loadDraft(): Partial<WaveLeaderRegistrationData> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored) as Partial<WaveLeaderRegistrationData>
    }
  } catch {
    // ignore
  }
  return {}
}

function saveDraft(data: WaveLeaderRegistrationData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function useWaveLeaderRegistration() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<WaveLeaderRegistrationData>(() => ({
    ...defaultFormData,
    ...loadDraft(),
  }))

  useEffect(() => {
    saveDraft(formData)
  }, [formData])

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 6)), [])
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), [])
  const goToStep = useCallback((n: number) => setStep(Math.max(1, Math.min(n, 6))), [])

  const updateFormData = useCallback((data: Partial<WaveLeaderRegistrationData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }, [])

  const submitMutation = useMutation({
    mutationFn: async (data: WaveLeaderRegistrationData) => {
      const { data: res } = await api.post<{
        success: boolean
        data?: { id: string }
        error?: { message: string }
      }>('/waveleader/register', {
        displayName: data.displayName,
        specialty: data.specialty,
        phone: data.phone,
        description: data.description,
        profilePhoto: data.profilePhoto,
        hourlyRate: data.hourlyRate,
        minDuration: data.minDuration,
        services: data.services,
        location: data.location?.address,
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        serviceRadius: data.serviceRadius,
        willingToTravel: data.willingToTravel,
        portfolioImages: data.portfolioImages,
        portfolioLinks: data.portfolioLinks,
        tags: [...data.services, ...data.certifications],
        communities: data.communities,
      })
      if (!res.success) {
        throw new Error(res.error?.message || 'Failed to submit application')
      }
      return res
    },
    onSuccess: () => {
      clearDraft()
      toast.success("Application submitted! We'll review it shortly.")
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      navigate('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit application')
    },
  })

  return {
    step,
    formData,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    submit: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
  }
}
