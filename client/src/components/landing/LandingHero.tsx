import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, CalendarDays, CheckCircle2, MapPin } from 'lucide-react'
import { DashboardPreview } from './DashboardPreview'

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-wave-border/60">
      {/* Blue wash bleeding out of the top-left, as in the reference design */}
      <div className="pointer-events-none absolute -left-40 -top-40 -z-10 h-[520px] w-[520px] rounded-full bg-wave-blue/20 blur-[140px]" />
      <div className="pointer-events-none absolute -right-32 top-20 -z-10 h-[420px] w-[420px] rounded-full bg-wave-cyan/10 blur-[140px]" />

      <div className="container mx-auto grid items-center gap-10 px-4 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10 lg:py-12">
        {/* Copy */}
        <div className="max-w-xl">
          {/* The map is the product; say so above the fold. */}
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-wave-border bg-wave-surface px-3 py-1.5 text-xs font-medium text-gray-300"
          >
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wave-cyan opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-wave-cyan" />
            </span>
            One live map of everywhere worth going
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl"
          >
            Turn local demand
            <br />
            into{' '}
            <span className="bg-gradient-to-r from-wave-blue-light via-wave-cyan to-wave-blue-light bg-clip-text text-transparent">
              real-world traffic.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="mt-6 text-base leading-relaxed text-gray-400"
          >
            Every venue, event and bar crawl sits on one live map — and so does the
            demand around it. See who wants to go out near you right now, send them
            an offer, manage the queue, and measure who actually walked in.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              to="/register?role=business"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-wave-blue px-6 text-sm font-semibold text-white transition-colors hover:bg-wave-blue-dark"
            >
              Sign Up
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-wave-border bg-wave-surface px-6 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-600 hover:text-white"
            >
              Book a Demo
              <CalendarDays className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-8 flex items-start gap-2 text-sm leading-snug text-gray-500"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-wave-blue-light" />
            <span>
              Used for restaurants, nightlife, pop-ups,
              <br className="hidden sm:block" /> and brand activations.
            </span>
          </motion.p>
        </div>

        {/* Product console */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          // No negative margin here: the section clips its overflow, so bleeding
          // the console past the container edge silently cut off the right-hand
          // column of the dashboard (offer button, vibe counts, rating card).
          className="min-w-0"
        >
          <DashboardPreview />

          <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-wave-blue-light" />
            Live map of nearby venues, check-ins and demand — the same map your
            customers browse.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
