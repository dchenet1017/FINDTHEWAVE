import { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, Instagram, Twitter, Youtube, Music2, Linkedin } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet'

const NAV_LINKS = [
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'For Businesses', to: '/register?role=business' },
  { label: 'For Communities', to: '/communities' },
  { label: 'Wave Leaders', to: '/become-waveleader' },
]

const ROLE_LINKS = [
  { label: "I'm Looking for Things To Do", to: '/register?role=user' },
  { label: 'I Own a Business', to: '/register?role=business' },
  { label: 'I Run a Community', to: '/communities' },
  { label: "I'm a Wave Leader", to: '/become-waveleader' },
]

const FOOTER_COLUMNS = [
  {
    heading: 'Product',
    links: [
      { label: 'How It Works', to: '/#how-it-works' },
      { label: 'For Businesses', to: '/register?role=business' },
      { label: 'For Communities', to: '/communities' },
      { label: 'Wave Leaders', to: '/become-waveleader' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/blog' },
      { label: 'Partners', to: '/communities' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'Help Center', to: '/help' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Status', to: '/help' },
      { label: 'Privacy Policy', to: '/privacy' },
    ],
  },
]

const SOCIAL_LINKS = [
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { label: 'TikTok', href: 'https://tiktok.com', icon: Music2 },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
  { label: 'Twitter', href: 'https://twitter.com', icon: Twitter },
  { label: 'YouTube', href: 'https://youtube.com', icon: Youtube },
]

/** Square "W" mark used in the header and footer lockups. */
function WaveMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-md bg-wave-blue text-sm font-black text-white ${className}`}
    >
      W
    </span>
  )
}

export function PublicLayout() {
  const { isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-wave-bg flex flex-col">
      <header className="sticky top-0 z-30 border-b border-wave-border bg-wave-bg/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-3.5">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <WaveMark />
            <span className="text-lg font-bold text-white">WaveFinder</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            <a
              href="/#how-it-works"
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              How It Works
            </a>
            <DropdownMenu
              align="left"
              trigger={
                <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white">
                  Roles
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              }
            >
              {ROLE_LINKS.map((role) => (
                <DropdownMenuItem key={role.label} onClick={() => navigate(role.to)}>
                  {role.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenu>
            {NAV_LINKS.slice(1).map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 lg:flex">
              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex h-9 items-center rounded-lg bg-wave-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-wave-blue-dark"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex h-9 items-center rounded-lg bg-wave-blue px-5 text-sm font-semibold text-white transition-colors hover:bg-wave-blue-dark"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-md text-gray-300 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen} side="right">
        <SheetHeader onClose={() => setMobileOpen(false)}>
          <SheetTitle className="flex items-center gap-2 text-white">
            <WaveMark className="h-6 w-6 text-xs" />
            WaveFinder
          </SheetTitle>
        </SheetHeader>
        <SheetContent className="flex flex-col gap-1">
          <a
            href="/#how-it-works"
            onClick={() => setMobileOpen(false)}
            className="rounded-md px-3 py-3 text-sm font-medium text-gray-200 hover:bg-white/5"
          >
            How It Works
          </a>
          <span className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Roles
          </span>
          {ROLE_LINKS.map((role) => (
            <button
              key={role.label}
              type="button"
              onClick={() => {
                setMobileOpen(false)
                navigate(role.to)
              }}
              className="rounded-md px-3 py-3 text-left text-sm font-medium text-gray-200 hover:bg-white/5"
            >
              {role.label}
            </button>
          ))}
          <span className="mt-2 h-px bg-wave-border" />
          {NAV_LINKS.slice(1).map((link) => (
            <Link
              key={link.label}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="rounded-md px-3 py-3 text-sm font-medium text-gray-200 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-4 space-y-2 border-t border-wave-border pt-4">
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-wave-border bg-wave-bg-deep">
        <div className="container mx-auto grid gap-10 px-4 py-12 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1.2fr)]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <WaveMark />
              <span className="text-lg font-bold text-white">WaveFinder</span>
            </Link>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-gray-500 transition-colors hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="text-xs font-semibold text-white">{column.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-gray-500 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="text-xs leading-relaxed text-gray-600 md:text-right">
            © {new Date().getFullYear()} WaveFinder, Inc.
            <br />
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
