import { motion } from 'framer-motion'
import { Disc3, GraduationCap, PartyPopper, ShoppingBag, Sparkles, UtensilsCrossed } from 'lucide-react'

/**
 * The reference design uses photography behind each tile. Until real imagery
 * is licensed, each category gets a distinct gradient in the same key so the
 * row still reads as six different scenes rather than six identical cards.
 */
const CATEGORIES = [
  {
    icon: UtensilsCrossed,
    label: 'Restaurants',
    badge: 'bg-[#F97316]',
    scene: 'from-[#7C2D12] via-[#431407] to-[#0B1020]',
  },
  {
    icon: Disc3,
    label: 'Nightlife',
    badge: 'bg-[#A855F7]',
    scene: 'from-[#6D28D9] via-[#3B0764] to-[#0B1020]',
  },
  {
    icon: PartyPopper,
    label: 'Pop-Ups',
    badge: 'bg-[#22C55E]',
    scene: 'from-[#166534] via-[#052E16] to-[#0B1020]',
  },
  {
    icon: Sparkles,
    label: 'Brand Activations',
    badge: 'bg-[#3B82F6]',
    scene: 'from-[#1D4ED8] via-[#172554] to-[#0B1020]',
  },
  {
    icon: GraduationCap,
    label: 'Campus Events',
    badge: 'bg-[#38BDF8]',
    scene: 'from-[#0E7490] via-[#083344] to-[#0B1020]',
  },
  {
    icon: ShoppingBag,
    label: 'Retail Launches',
    badge: 'bg-[#14B8A6]',
    scene: 'from-[#0F766E] via-[#042F2E] to-[#0B1020]',
  },
]

export function BuiltForSection() {
  return (
    <section className="border-b border-wave-border/60 py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">Built for</h2>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map(({ icon: Icon, label, badge, scene }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`group relative flex h-36 flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-wave-border bg-gradient-to-b ${scene}`}
            >
              <span className="pointer-events-none absolute inset-0 bg-black/25 transition-colors group-hover:bg-black/10" />
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full ${badge} shadow-lg shadow-black/40`}
              >
                <Icon className="h-5 w-5 text-white" />
              </span>
              <span className="relative px-2 text-center text-xs font-semibold text-white">
                {label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
