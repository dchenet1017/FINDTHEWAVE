// Standardized response helpers for WaveFinder

export const successResponse = <T>(data: T) => ({
  success: true,
  data,
})

export const errorResponse = (code: string, message: string) => ({
  success: false,
  error: { code, message },
})

