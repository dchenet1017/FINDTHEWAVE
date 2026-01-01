import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const { user } = useAuthStore()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-gray-400 mt-2">Manage your account information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-400">Email</label>
            <p className="text-white">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400">Name</label>
            <p className="text-white">
              {user?.firstName || user?.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : 'Not set'}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400">Role</label>
            <p className="text-white capitalize">{user?.role?.toLowerCase()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-400">Email Verified</label>
            <p className={user?.isVerified ? 'text-success' : 'text-warning'}>
              {user?.isVerified ? 'Verified' : 'Not Verified'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

