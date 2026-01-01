import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Save, Settings, DollarSign, Shield, Mail, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Switch } from '@/components/ui/Switch'
import { Textarea } from '@/components/ui/Textarea'
import { adminService } from '@/services/admin.service'
import PricingSettings from './PricingSettings'
import { toast } from 'sonner'

export default function AdminSettings() {
  const queryClient = useQueryClient()

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState({
    siteName: 'WaveFinder',
    tagline: 'Discover Your Next Adventure',
    maintenanceMode: false,
    defaultUserRole: 'USER',
  })

  // Pricing Settings
  const [pricingSettings, setPricingSettings] = useState({
    baseAdRate: 50,
    commissionPercentage: 15,
    serviceFee: 5,
    dynamicPricing: true,
  })

  // Moderation Settings
  const [moderationSettings, setModerationSettings] = useState({
    autoApproveBusinesses: false,
    autoVerifyWaveLeaders: false,
    contentFilters: true,
    blockedWords: 'spam,scam,fraud',
  })

  // Fetch current settings
  const { isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      return {
        platform: platformSettings,
        pricing: pricingSettings,
        moderation: moderationSettings,
      }
    },
    onSuccess: (data) => {
      if (data.platform) setPlatformSettings(data.platform)
      if (data.pricing) setPricingSettings(data.pricing)
      if (data.moderation) setModerationSettings(data.moderation)
    },
  })

  // Save mutations
  const savePlatformMutation = useMutation({
    mutationFn: async (data: typeof platformSettings) => {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return data
    },
    onSuccess: () => {
      toast.success('Platform settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
    onError: () => {
      toast.error('Failed to save platform settings')
    },
  })

  const savePricingMutation = useMutation({
    mutationFn: async (data: typeof pricingSettings) => {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return data
    },
    onSuccess: () => {
      toast.success('Pricing settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
    onError: () => {
      toast.error('Failed to save pricing settings')
    },
  })

  const saveModerationMutation = useMutation({
    mutationFn: async (data: typeof moderationSettings) => {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500))
      return data
    },
    onSuccess: () => {
      toast.success('Moderation settings saved successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
    },
    onError: () => {
      toast.error('Failed to save moderation settings')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Settings</h1>
        <p className="text-gray-400 mt-1">
          Configure platform settings and preferences
        </p>
      </div>

      <Tabs defaultValue="platform" className="space-y-6">
        <TabsList className="bg-dark-card border-gray-800">
          <TabsTrigger value="platform" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="emails" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Templates
          </TabsTrigger>
        </TabsList>

        {/* Platform Settings */}
        <TabsContent value="platform">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>
                Configure basic platform information and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={platformSettings.siteName}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, siteName: e.target.value })
                  }
                  placeholder="WaveFinder"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={platformSettings.tagline}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, tagline: e.target.value })
                  }
                  placeholder="Discover Your Next Adventure"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance">Maintenance Mode</Label>
                  <p className="text-sm text-gray-400">
                    Enable to put the site in maintenance mode
                  </p>
                </div>
                <Switch
                  id="maintenance"
                  checked={platformSettings.maintenanceMode}
                  onCheckedChange={(checked) =>
                    setPlatformSettings({ ...platformSettings, maintenanceMode: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultRole">Default User Role</Label>
                <select
                  id="defaultRole"
                  value={platformSettings.defaultUserRole}
                  onChange={(e) =>
                    setPlatformSettings({ ...platformSettings, defaultUserRole: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="USER">User</option>
                  <option value="WAVELEADER">WaveLeader</option>
                  <option value="BUSINESS">Business</option>
                </select>
              </div>

              <Button
                onClick={() => savePlatformMutation.mutate(platformSettings)}
                disabled={savePlatformMutation.isPending}
                className="w-full"
              >
                {savePlatformMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Platform Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing Settings */}
        <TabsContent value="pricing">
          <PricingSettings
            settings={pricingSettings}
            onSettingsChange={setPricingSettings}
            onSave={() => savePricingMutation.mutate(pricingSettings)}
            isSaving={savePricingMutation.isPending}
          />
        </TabsContent>

        {/* Moderation Settings */}
        <TabsContent value="moderation">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Moderation Settings</CardTitle>
              <CardDescription>
                Configure content moderation and approval workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoApprove">Auto-Approve Businesses</Label>
                  <p className="text-sm text-gray-400">
                    Automatically approve new business registrations
                  </p>
                </div>
                <Switch
                  id="autoApprove"
                  checked={moderationSettings.autoApproveBusinesses}
                  onCheckedChange={(checked) =>
                    setModerationSettings({
                      ...moderationSettings,
                      autoApproveBusinesses: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoVerify">Auto-Verify WaveLeaders</Label>
                  <p className="text-sm text-gray-400">
                    Automatically verify new WaveLeader accounts
                  </p>
                </div>
                <Switch
                  id="autoVerify"
                  checked={moderationSettings.autoVerifyWaveLeaders}
                  onCheckedChange={(checked) =>
                    setModerationSettings({
                      ...moderationSettings,
                      autoVerifyWaveLeaders: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="contentFilters">Content Filters</Label>
                  <p className="text-sm text-gray-400">
                    Enable automatic content filtering
                  </p>
                </div>
                <Switch
                  id="contentFilters"
                  checked={moderationSettings.contentFilters}
                  onCheckedChange={(checked) =>
                    setModerationSettings({
                      ...moderationSettings,
                      contentFilters: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="blockedWords">Blocked Words (comma-separated)</Label>
                <Textarea
                  id="blockedWords"
                  value={moderationSettings.blockedWords}
                  onChange={(e) =>
                    setModerationSettings({
                      ...moderationSettings,
                      blockedWords: e.target.value,
                    })
                  }
                  placeholder="spam,scam,fraud"
                  rows={4}
                />
                <p className="text-sm text-gray-400">
                  Words that will trigger content moderation
                </p>
              </div>

              <Button
                onClick={() => saveModerationMutation.mutate(moderationSettings)}
                disabled={saveModerationMutation.isPending}
                className="w-full"
              >
                {saveModerationMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Moderation Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Templates */}
        <TabsContent value="emails">
          <Card className="bg-dark-card border-gray-800">
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
              <CardDescription>
                View email templates (editing coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-dark-bg border border-gray-800">
                  <h3 className="font-semibold text-white mb-2">Welcome Email</h3>
                  <p className="text-sm text-gray-400">
                    Sent to new users upon registration
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Template editing will be available in a future update
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-dark-bg border border-gray-800">
                  <h3 className="font-semibold text-white mb-2">Booking Confirmation</h3>
                  <p className="text-sm text-gray-400">
                    Sent when a booking is confirmed
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Template editing will be available in a future update
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-dark-bg border border-gray-800">
                  <h3 className="font-semibold text-white mb-2">Password Reset</h3>
                  <p className="text-sm text-gray-400">
                    Sent when user requests password reset
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Template editing will be available in a future update
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
