import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from '@/hooks/useUserFavorites'
import { Loader2 } from 'lucide-react'

interface FavoriteButtonProps {
  businessId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
}

export function FavoriteButton({
  businessId,
  className,
  size = 'sm',
  variant = 'ghost',
}: FavoriteButtonProps) {
  const isFavorite = useIsFavorite(businessId)
  const addFavorite = useAddFavorite()
  const removeFavorite = useRemoveFavorite()

  const isLoading = addFavorite.isPending || removeFavorite.isPending

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isFavorite) {
      removeFavorite.mutate(businessId)
    } else {
      addFavorite.mutate(businessId)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        'transition-colors',
        isFavorite && 'text-red-500 hover:text-red-600',
        className
      )}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4 transition-all',
            isFavorite && 'fill-current'
          )}
        />
      )}
    </Button>
  )
}

