import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, Globe, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useBusiness } from '@/hooks/admin/useBusinesses'
import { BusinessApprovalModal } from '@/features/admin/businesses/BusinessApprovalModal'
import { useState } from 'react'
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { format } from 'date-fns'

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: business, isLoading } = useBusiness(id!)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null)

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Business not found</p>
      </div>
    )
  }

  const statusConfig = {
    PENDING: { variant: 'warning' as const, label: 'Pending Approval' },
    APPROVED: { variant: 'success' as const, label: 'Approved' },
    REJECTED: { variant: 'destructive' as const, label: 'Rejected' },
  }

  const status = statusConfig[business.approvalStatus] || statusConfig.PENDING

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {business.images && business.images.length > 0 ? (
              <img
                src={business.images[0]}
                alt={business.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-dark-card flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-white">{business.name}</h1>
              <p className="text-gray-400 mt-1">{business.city}, {business.state}</p>
            </div>
            <Badge variant={status.variant} className="ml-auto">
              {status.label}
            </Badge>
          </div>
        </div>
      </div>

      {/* Approval Actions (if pending) */}
      {business.approvalStatus === 'PENDING' && (
        <Card className="border-primary/50 bg-primary/10">
          <CardHeader>
            <CardTitle className="text-white">Review & Approve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setApprovalAction('approve')}
                className="bg-success hover:bg-success/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Business
              </Button>
              <Button
                variant="destructive"
                onClick={() => setApprovalAction('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject Business
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                <p className="text-white">{business.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Type</h3>
                <Badge>{business.type}</Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-1">Address</h3>
                <div className="flex items-start gap-2 text-white">
                  <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <p>{business.address}</p>
                    <p>{business.city}, {business.state} {business.zipCode}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {business.phone && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Phone</h3>
                    <div className="flex items-center gap-2 text-white">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a href={`tel:${business.phone}`} className="hover:text-primary">
                        {business.phone}
                      </a>
                    </div>
                  </div>
                )}
                {business.website && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Website</h3>
                    <div className="flex items-center gap-2 text-white">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        Visit Website
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images Gallery */}
          {business.images && business.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-white">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {business.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${business.name} ${index + 1}`}
                      className="w-full h-48 rounded-lg object-cover"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Owner Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Owner Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Avatar
                  src={business.user.avatar || undefined}
                  fallback={
                    business.user.firstName?.[0] ||
                    business.user.email[0].toUpperCase()
                  }
                  size="md"
                />
                <div>
                  <p className="font-medium text-white">
                    {business.user.firstName && business.user.lastName
                      ? `${business.user.firstName} ${business.user.lastName}`
                      : 'No Name'}
                  </p>
                  <p className="text-sm text-gray-400">{business.user.email}</p>
                </div>
              </div>
              <Link to={`/admin/users/${business.user.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  View Owner Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-white">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {business._count && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Promotions</span>
                    <span className="text-white font-medium">{business._count.promotions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Events</span>
                    <span className="text-white font-medium">{business._count.events}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Check-ins</span>
                    <span className="text-white font-medium">{business._count.checkIns}</span>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-gray-800">
                <div className="flex justify-between">
                  <span className="text-gray-400">Submitted</span>
                  <span className="text-white font-medium">
                    {format(new Date(business.createdAt), 'MMM dd, yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approval Modal */}
      {approvalAction && (
        <BusinessApprovalModal
          business={business}
          isOpen={!!approvalAction}
          onClose={() => setApprovalAction(null)}
          action={approvalAction}
        />
      )}
    </div>
  )
}


