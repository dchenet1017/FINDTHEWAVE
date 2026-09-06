import { LandingHero } from '@/components/landing/LandingHero'
import { HowItWorksSection } from '@/components/landing/HowItWorksSection'
import { WhyUseItSection } from '@/components/landing/WhyUseItSection'
import { BuiltForSection } from '@/components/landing/BuiltForSection'
import { StatsCta } from '@/components/landing/StatsCta'

export default function LandingPage() {
  return (
    <div className="bg-wave-bg">
      <LandingHero />
      <HowItWorksSection />
      <WhyUseItSection />
      <BuiltForSection />
      <StatsCta />
    </div>
  )
}
