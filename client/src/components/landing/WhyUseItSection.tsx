import { motion } from 'framer-motion'
import { BarChart3, MapPin, Users, Zap } from 'lucide-react'

const REASONS = [
  {
    icon: MapPin,
    tint: 'bg-wave-blue/15 text-wave-blue-light',
    title: 'Live map discovery',
    body: 'One map of every venue, event and crawl — plus the people nearby who are ready to go out right now.',
  },
  {
    icon: Users,
    tint: 'bg-[#22C55E]/15 text-[#4ADE80]',
    title: 'Real-time queues',
    body: 'Convert intent into attendance with seamless queue management.',
  },
  {
    icon: Zap,
    tint: 'bg-[#A855F7]/15 text-[#C084FC]',
    title: 'Launch activations',
    body: 'Power pop-ups, brand activations, and special events with instant reach.',
  },
  {
    icon: BarChart3,
    tint: 'bg-[#F97316]/15 text-[#FB923C]',
    title: 'Measure turnout',
    body: 'Know what drove visits, who showed up, and what to do next.',
  },
]

export function WhyUseItSection() {
  return (
    <section className="border-b border-wave-border/60 py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
          Why <span className="text-wave-blue-light">Businesses and Brands</span> Use It
        </h2>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map(({ icon: Icon, tint, title, body }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-xl border border-wave-border bg-wave-surface/70 p-5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}>
                <Icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
