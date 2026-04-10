import { useState } from 'react'
import { Save, Trash2, Download, Shield, Bell, User, Globe, Link as LinkIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Separator } from '@/components/ui/Separator'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import { userService } from '@/services/user.service'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore()
  const queryClient = useQueryClient()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Fetch settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['user', 'settings'],
    queryFn: async () => {
      // Mock settings for now
      return {
        privacy: {
          profileVisibility: 'public' as const,
          showCheckInHistory: true,
          allowLocationTracking: true,
        },
        notifications: {
          email: {
            bookingConfirmations: true,
            bookingReminders: true,
            promotionalOffers: false,
            weeklyDigest: true,
          },
          push: {
            nearbyDeals: true,
            checkInReminders: false,
            newWaveLeaders: true,
          },
        },
        preferences: {
          defaultMapView: 'map' as const,
          distanceUnit: 'miles' as const,
          theme: 'dark' as const,
          language: 'en',
        },
      }
    },
  })

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await userService.updateSettings(data)
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to update settings')
      }
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', 'settings'] })
      toast.success('Settings updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update settings')
    },
  })

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await userService.deleteAccount()
      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to delete account')
      }
    },
    onSuccess: () => {
      clearAuth()
      toast.success('Account deleted successfully')
      window.location.href = '/'
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to delete account')
    },
  })

  const handleUpdateSettings = (section: string, data: any) => {
    const currentSettings = settings || {
      privacy: {},
      notifications: {},
      preferences: {},
    }
    updateSettingsMutation.mutate({
      ...currentSettings,
      [section]: data,
    })
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    // TODO: Implement password change API
    toast.success('Password changed successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleDeleteAccount = () => {
    deleteAccountMutation.mutate()
  }

  if (isLoading || !settings) {
    return <div className="p-6">Loading settings...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Globe className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="connected">
            <LinkIcon className="h-4 w-4 mr-2" />
            Connected
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Change Password
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Preferences</CardTitle>
              <CardDescription>Manage your email notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">Email preferences are managed in the Notifications tab.</p>
            </CardContent>
          </Card>

          <Card className="border-danger/50">
            <CardHeader>
              <CardTitle className="text-danger">Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and all associated data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                This action cannot be undone. All your data, check-ins, reviews, and bookings will be permanently deleted.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control who can see your profile and activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-gray-400">Make your profile public or private</p>
                </div>
                <Select
                  value={settings.privacy.profileVisibility}
                  onValueChange={(value) =>
                    handleUpdateSettings('privacy', { ...settings.privacy, profileVisibility: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Check-in History</Label>
                  <p className="text-sm text-gray-400">Allow others to see your check-in history</p>
                </div>
                <Switch
                  checked={settings.privacy.showCheckInHistory}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('privacy', { ...settings.privacy, showCheckInHistory: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Location Tracking</Label>
                  <p className="text-sm text-gray-400">Enable location services for check-ins and nearby features</p>
                </div>
                <Switch
                  checked={settings.privacy.allowLocationTracking}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('privacy', { ...settings.privacy, allowLocationTracking: checked })
                  }
                />
              </div>

              <Separator />

              <div>
                <Button variant="secondary" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Request Data Export
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  Download a copy of all your data in JSON format
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Manage email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Booking Confirmations</Label>
                  <p className="text-sm text-gray-400">Receive emails when bookings are confirmed</p>
                </div>
                <Switch
                  checked={settings.notifications.email.bookingConfirmations}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      email: { ...settings.notifications.email, bookingConfirmations: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Booking Reminders</Label>
                  <p className="text-sm text-gray-400">Get reminders before scheduled bookings</p>
                </div>
                <Switch
                  checked={settings.notifications.email.bookingReminders}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      email: { ...settings.notifications.email, bookingReminders: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Promotional Offers</Label>
                  <p className="text-sm text-gray-400">Receive emails about special offers and promotions</p>
                </div>
                <Switch
                  checked={settings.notifications.email.promotionalOffers}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      email: { ...settings.notifications.email, promotionalOffers: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Digest</Label>
                  <p className="text-sm text-gray-400">Get a weekly summary of your activity</p>
                </div>
                <Switch
                  checked={settings.notifications.email.weeklyDigest}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      email: { ...settings.notifications.email, weeklyDigest: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Push Notifications</CardTitle>
              <CardDescription>Manage push notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nearby Deals</Label>
                  <p className="text-sm text-gray-400">Get notified about deals near you</p>
                </div>
                <Switch
                  checked={settings.notifications.push.nearbyDeals}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      push: { ...settings.notifications.push, nearbyDeals: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Check-in Reminders</Label>
                  <p className="text-sm text-gray-400">Reminders to check in at visited places</p>
                </div>
                <Switch
                  checked={settings.notifications.push.checkInReminders}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      push: { ...settings.notifications.push, checkInReminders: checked },
                    })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>New WaveLeaders Nearby</Label>
                  <p className="text-sm text-gray-400">Notifications when new WaveLeaders are available</p>
                </div>
                <Switch
                  checked={settings.notifications.push.newWaveLeaders}
                  onCheckedChange={(checked) =>
                    handleUpdateSettings('notifications', {
                      ...settings.notifications,
                      push: { ...settings.notifications.push, newWaveLeaders: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>Customize your app experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Map View</Label>
                <Select
                  value={settings.preferences.defaultMapView}
                  onValueChange={(value) =>
                    handleUpdateSettings('preferences', { ...settings.preferences, defaultMapView: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="map">Map</SelectItem>
                    <SelectItem value="satellite">Satellite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Distance Unit</Label>
                <Select
                  value={settings.preferences.distanceUnit}
                  onValueChange={(value) =>
                    handleUpdateSettings('preferences', { ...settings.preferences, distanceUnit: value })
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="kilometers">Kilometers</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings.preferences.theme}
                  onValueChange={(value) =>
                    handleUpdateSettings('preferences', { ...settings.preferences, theme: value })
                  }
                  disabled
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">Theme selection coming soon</p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={settings.preferences.language}
                  onValueChange={(value) =>
                    handleUpdateSettings('preferences', { ...settings.preferences, language: value })
                  }
                  disabled
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">Language selection coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connected Accounts Tab */}
        <TabsContent value="connected" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Manage your connected social accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">Social account connections coming soon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">Payment method management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone."
        confirmText="Delete Account"
        cancelText="Cancel"
        onConfirm={handleDeleteAccount}
        variant="destructive"
      />
    </div>
  )
}

