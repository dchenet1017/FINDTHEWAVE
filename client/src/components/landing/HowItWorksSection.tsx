import { motion } from 'framer-motion'
import { BarChart3, CalendarPlus, ChevronRight, ListChecks, Radio, Users } from 'lucide-react'

const STEPS = [
  {
    icon: CalendarPlus,
    title: 'Create your event / offer',
    body: 'Set up your event, offer, or activation in minutes. Add details, timing, and location.',
  },
  {
    icon: Radio,
    title: 'Go live on the map',
    body: 'Your venue, offer and event appear on the live map people nearby are already browsing.',
  },
  {
    icon: Users,
    title: 'Capture local demand',
    body: 'Nearby people discover and show interest. You see demand grow instantly.',
  },
  {
    icon: ListChecks,
    title: 'Manage queue or RSVPs',
    body: 'Let people join the queue or RSVP. Keep things organized and reduce friction.',
  },
  {
    icon: BarChart3,
    title: 'Measure visits and results',
    body: 'Track check-ins, foot traffic, and key metrics to see what is working and optimize.',
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="border-b border-wave-border/60 py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          How <span className="text-wave-blue-light">WaveFinder</span> Works for Business
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <div key={title} className="flex items-stretch lg:contents">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="relative flex-1 rounded-xl border border-wave-border bg-wave-surface/70 p-5 lg:mx-1.5"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wave-blue text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-sm font-semibold leading-snug text-white">
                  {i + 1}. {title}
                </h3>
                <Icon className="mt-4 h-6 w-6 text-wave-blue-light" />
                <p className="mt-4 text-xs leading-relaxed text-gray-500">{body}</p>

                {/* Connector, desktop only */}
                {i < STEPS.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-gray-700 lg:block" />
                )}
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
