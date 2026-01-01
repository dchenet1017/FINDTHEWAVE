import { useState } from 'react'
import { Save, DollarSign, Calculator } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Switch } from '@/components/ui/Switch'
import { formatCurrency } from '@/lib/utils'

interface PricingSettingsProps {
  settings: {
    baseAdRate: number
    commissionPercentage: number
    serviceFee: number
    dynamicPricing: boolean
  }
  onSettingsChange: (settings: any) => void
  onSave: () => void
  isSaving: boolean
}

export default function PricingSettings({
  settings,
  onSettingsChange,
  onSave,
  isSaving,
}: PricingSettingsProps) {
  const [zoneMultipliers, setZoneMultipliers] = useState([
    { zone: 'Downtown', multiplier: 1.5 },
    { zone: 'Suburbs', multiplier: 1.0 },
    { zone: 'Airport', multiplier: 2.0 },
    { zone: 'Beach', multiplier: 1.8 },
  ])

  const calculatePreview = () => {
    const baseRate = settings.baseAdRate
    const commission = (baseRate * settings.commissionPercentage) / 100
    const serviceFee = settings.serviceFee
    const total = baseRate + commission + serviceFee

    return {
      baseRate,
      commission,
      serviceFee,
      total,
    }
  }

  const preview = calculatePreview()

  return (
    <div className="space-y-6">
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>
            Set base rates, commissions, and service fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="baseAdRate">Base Advertising Rate (per day)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="baseAdRate"
                type="number"
                value={settings.baseAdRate}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    baseAdRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-400">
              Base rate for advertising before multipliers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission">Commission Percentage (%)</Label>
            <Input
              id="commission"
              type="number"
              value={settings.commissionPercentage}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  commissionPercentage: parseFloat(e.target.value) || 0,
                })
              }
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-sm text-gray-400">
              Platform commission on bookings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceFee">Service Fee (flat)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="serviceFee"
                type="number"
                value={settings.serviceFee}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    serviceFee: parseFloat(e.target.value) || 0,
                  })
                }
                className="pl-10"
                min="0"
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-400">
              Fixed service fee per booking
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dynamicPricing">Dynamic Pricing</Label>
              <p className="text-sm text-gray-400">
                Enable zone-based pricing multipliers
              </p>
            </div>
            <Switch
              id="dynamicPricing"
              checked={settings.dynamicPricing}
              onCheckedChange={(checked) =>
                onSettingsChange({
                  ...settings,
                  dynamicPricing: checked,
                })
              }
            />
          </div>

          {settings.dynamicPricing && (
            <div className="space-y-4">
              <Label>Zone Multipliers</Label>
              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-bg">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Zone
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Multiplier
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {zoneMultipliers.map((zone, index) => (
                      <tr key={zone.zone}>
                        <td className="px-4 py-3 text-white">{zone.zone}</td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={zone.multiplier}
                            onChange={(e) => {
                              const newMultipliers = [...zoneMultipliers]
                              newMultipliers[index].multiplier =
                                parseFloat(e.target.value) || 0
                              setZoneMultipliers(newMultipliers)
                            }}
                            className="w-24"
                            min="0"
                            step="0.1"
                          />
                        </td>
                        <td className="px-4 py-3 text-white">
                          {formatCurrency(settings.baseAdRate * zone.multiplier)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview Calculator */}
          <Card className="bg-dark-bg border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5" />
                Pricing Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Base Rate:</span>
                <span className="text-white">{formatCurrency(preview.baseRate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  Commission ({settings.commissionPercentage}%):
                </span>
                <span className="text-white">{formatCurrency(preview.commission)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Service Fee:</span>
                <span className="text-white">{formatCurrency(preview.serviceFee)}</span>
              </div>
              <div className="border-t border-gray-800 pt-3 mt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Total:</span>
                  <span className="font-bold text-primary text-lg">
                    {formatCurrency(preview.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Pricing Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
