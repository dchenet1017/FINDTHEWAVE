import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { UserLayout } from '@/components/layout/UserLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { BusinessLayout } from '@/components/layout/BusinessLayout'
import { WaveLeaderLayout } from '@/components/layout/WaveLeaderLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { MainLayout } from '@/components/layout/MainLayout'

// Public pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import MapPage from '@/pages/map/MapPage'
import BusinessDetailPage from '@/pages/business/BusinessDetailPage'
import CommunitiesPage from '@/pages/communities/CommunitiesPage'
import CommunityDetailPage from '@/pages/communities/CommunityDetailPage'
import BecomeWaveLeaderPage from '@/pages/waveleader/BecomeWaveLeaderPage'
import WaveLeaderRegistrationPage from '@/pages/waveleader/WaveLeaderRegistrationPage'

// Dashboard pages
import UserDashboard from '@/pages/dashboard/UserDashboard'
import ProfilePage from '@/pages/dashboard/ProfilePage'
import SettingsPage from '@/pages/dashboard/SettingsPage'
import UserMapPage from '@/pages/dashboard/UserMapPage'
import PlacesPage from '@/pages/dashboard/PlacesPage'
import BookingsPage from '@/pages/dashboard/BookingsPage'
import RewardsPage from '@/pages/dashboard/RewardsPage'
import PassportPage from '@/pages/dashboard/PassportPage'
import MyEventsPage from '@/pages/dashboard/MyEventsPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/users/UserManagement'
import BusinessManagement from '@/pages/admin/businesses/BusinessManagement'
import BusinessDetail from '@/pages/admin/businesses/BusinessDetail'
import WaveLeaderManagement from '@/pages/admin/waveleaders/WaveLeaderManagement'
import WaveLeaderDetail from '@/pages/admin/waveleaders/WaveLeaderDetail'
import AnalyticsOverview from '@/pages/admin/analytics/AnalyticsOverview'
import RevenueAnalytics from '@/pages/admin/analytics/RevenueAnalytics'
import EngagementAnalytics from '@/pages/admin/analytics/EngagementAnalytics'
import ListingsPage from '@/pages/admin/content/ListingsPage'
import AdminEventsPage from '@/pages/admin/content/AdminEventsPage'
import PromotionsPage from '@/pages/admin/content/PromotionsPage'
import AdminSettings from '@/pages/admin/settings/AdminSettings'
import AdminMapPage from '@/pages/admin/AdminMapPage'

// Business pages
import BusinessDashboard from '@/pages/business/BusinessDashboard'
import BusinessMapPage from '@/pages/business/BusinessMapPage'
import BusinessAnalyticsPage from '@/pages/business/BusinessAnalyticsPage'
import AdvertisementsPage from '@/pages/business/AdvertisementsPage'
import CreateAdPage from '@/pages/business/CreateAdPage'

// WaveLeader pages
import WaveLeaderDashboard from '@/pages/waveleader/WaveLeaderDashboard'
import WaveLeaderBookingsPage from '@/pages/waveleader/WaveLeaderBookingsPage'
import WaveLeaderMapPage from '@/pages/waveleader/WaveLeaderMapPage'
import WaveLeaderCommunitiesPage from '@/pages/waveleader/WaveLeaderCommunitiesPage'
import WaveLeaderEarningsPage from '@/pages/waveleader/WaveLeaderEarningsPage'
import WaveLeaderAnalyticsPage from '@/pages/waveleader/WaveLeaderAnalyticsPage'
import WaveLeaderProfilePage from '@/pages/waveleader/WaveLeaderProfilePage'
import WaveLeaderSettingsPage from '@/pages/waveleader/WaveLeaderSettingsPage'
import PublicWaveLeaderProfilePage from '@/pages/waveleader/PublicWaveLeaderProfilePage'
import WaveLeadersPage from '@/pages/waveleader/WaveLeadersPage'
import EventsPage from '@/pages/events/EventsPage'
import EventDetailsPage from '@/pages/events/EventDetailsPage'
import EventsManagementPage from '@/pages/business/EventsManagementPage'
import CreateEventPage from '@/pages/business/CreateEventPage'
import EventAttendeesPage from '@/pages/business/EventAttendeesPage'
import EventCheckInPage from '@/pages/business/EventCheckInPage'
import CrawlsPage from '@/pages/crawls/CrawlsPage'
import CrawlDetailsPage from '@/pages/crawls/CrawlDetailsPage'
import CrawlsManagementPage from '@/pages/business/CrawlsManagementPage'
import CreateCrawlPage from '@/pages/business/CreateCrawlPage'
import CrawlAttendeesPage from '@/pages/business/CrawlAttendeesPage'
import CrawlStopCheckInPage from '@/pages/business/CrawlStopCheckInPage'
import AdminCrawlsPage from '@/pages/admin/content/AdminCrawlsPage'
import GoOutQueuePage from '@/pages/business/GoOutQueuePage'
import BookWaveLeaderPage from '@/pages/booking/BookWaveLeaderPage'
import PaymentPage from '@/pages/booking/PaymentPage'
import BookingConfirmationPage from '@/pages/booking/BookingConfirmationPage'
import WriteReviewPage from '@/pages/booking/WriteReviewPage'
import { RequireAuthMainLayout } from '@/components/auth/RequireAuthMainLayout'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      {
        path: 'booking',
        element: <RequireAuthMainLayout />,
        children: [
          { path: ':waveLeaderId/payment', element: <PaymentPage /> },
          { path: 'confirmation/:bookingId', element: <BookingConfirmationPage /> },
          { path: ':bookingId/review', element: <WriteReviewPage /> },
        ],
      },
      {
        path: '',
        element: <MainLayout />,
        children: [
          { path: 'map', element: <MapPage /> },
          { path: 'business/:id', element: <BusinessDetailPage /> },
          { path: 'communities', element: <CommunitiesPage /> },
          { path: 'communities/:id', element: <CommunityDetailPage /> },
          { path: 'become-waveleader', element: <BecomeWaveLeaderPage /> },
          { path: 'waveleader/:id/profile', element: <PublicWaveLeaderProfilePage /> },
          { path: 'waveleaders', element: <WaveLeadersPage /> },
          { path: 'events', element: <EventsPage /> },
          { path: 'events/:id', element: <EventDetailsPage /> },
          { path: 'crawls', element: <CrawlsPage /> },
          { path: 'crawls/:id', element: <CrawlDetailsPage /> },
          { path: 'booking/:waveLeaderId', element: <BookWaveLeaderPage /> },
        ],
      },
    ],
  },

  // WaveLeader registration (protected, USER+)
  {
    path: '/waveleader/register',
    element: <ProtectedRoute allowedRoles={['USER', 'WAVELEADER', 'ADMIN']} />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <WaveLeaderRegistrationPage /> },
        ],
      },
    ],
  },

  // Protected user routes
  {
    path: '/dashboard',
    element: <ProtectedRoute allowedRoles={['USER', 'WAVELEADER', 'BUSINESS', 'ADMIN']} />,
    children: [
      {
        element: <UserLayout />,
        children: [
          { index: true, element: <UserDashboard /> },
          { path: 'map', element: <UserMapPage /> },
          { path: 'places', element: <PlacesPage /> },
          { path: 'bookings', element: <BookingsPage /> },
          { path: 'events', element: <MyEventsPage /> },
          { path: 'passport', element: <PassportPage /> },
          { path: 'communities', element: <CommunitiesPage /> },
          { path: 'rewards', element: <RewardsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },

  // Admin routes
  {
    path: '/admin',
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'businesses', element: <BusinessManagement /> },
          { path: 'businesses/:id', element: <BusinessDetail /> },
          { path: 'waveleaders', element: <WaveLeaderManagement /> },
          { path: 'waveleaders/:id', element: <WaveLeaderDetail /> },
          { path: 'listings', element: <ListingsPage /> },
          { path: 'events', element: <AdminEventsPage /> },
          { path: 'crawls', element: <AdminCrawlsPage /> },
          { path: 'promotions', element: <PromotionsPage /> },
          { path: 'analytics', element: <AnalyticsOverview /> },
          { path: 'analytics/revenue', element: <RevenueAnalytics /> },
          { path: 'analytics/engagement', element: <EngagementAnalytics /> },
          { path: 'map', element: <AdminMapPage /> },
          { path: 'settings', element: <AdminSettings /> },
        ],
      },
    ],
  },

  // Business routes
  {
    path: '/business',
    element: <ProtectedRoute allowedRoles={['BUSINESS']} />,
    children: [
      {
        index: true,
        element: <Navigate to="/business/dashboard" replace />,
      },
      {
        element: <BusinessLayout />,
        children: [
          { path: 'dashboard', element: <BusinessDashboard /> },
          { path: 'analytics', element: <BusinessAnalyticsPage /> },
          { path: 'map', element: <BusinessMapPage /> },
          { path: 'ads', element: <AdvertisementsPage /> },
          { path: 'ads/create', element: <CreateAdPage /> },
          { path: 'ads/:id/edit', element: <CreateAdPage /> },
          { path: 'ads/:id/analytics', element: <div className="p-8 text-center text-gray-400">Ad analytics page coming soon</div> },
          { path: 'events', element: <EventsManagementPage /> },
          { path: 'events/create', element: <CreateEventPage /> },
          { path: 'events/:id/edit', element: <CreateEventPage /> },
          { path: 'events/:id/attendees', element: <EventAttendeesPage /> },
          { path: 'events/:id/check-in', element: <EventCheckInPage /> },
          { path: 'crawls', element: <CrawlsManagementPage /> },
          { path: 'crawls/create', element: <CreateCrawlPage /> },
          { path: 'crawls/:id/edit', element: <CreateCrawlPage /> },
          { path: 'crawls/:id/attendees', element: <CrawlAttendeesPage /> },
          { path: 'crawls/:id/check-in', element: <CrawlStopCheckInPage /> },
          { path: 'go-out', element: <GoOutQueuePage /> },
          { path: 'promotions', element: <div className="p-8 text-center text-gray-400">Promotions page coming soon</div> },
          { path: 'reviews', element: <div className="p-8 text-center text-gray-400">Reviews page coming soon</div> },
          { path: 'customers', element: <div className="p-8 text-center text-gray-400">Customers page coming soon</div> },
          { path: 'revenue', element: <div className="p-8 text-center text-gray-400">Revenue page coming soon</div> },
          { path: 'profile', element: <div className="p-8 text-center text-gray-400">Profile page coming soon</div> },
          { path: 'settings', element: <div className="p-8 text-center text-gray-400">Settings page coming soon</div> },
        ],
      },
    ],
  },

  // WaveLeader routes
  {
    path: '/waveleader',
    element: <ProtectedRoute allowedRoles={['WAVELEADER', 'ADMIN']} />,
    children: [
      {
        element: <WaveLeaderLayout />,
        children: [
          { path: 'dashboard', element: <WaveLeaderDashboard /> },
          { path: 'bookings', element: <WaveLeaderBookingsPage /> },
          { path: 'map', element: <WaveLeaderMapPage /> },
          { path: 'communities', element: <WaveLeaderCommunitiesPage /> },
          { path: 'earnings', element: <WaveLeaderEarningsPage /> },
          { path: 'analytics', element: <WaveLeaderAnalyticsPage /> },
          { path: 'profile', element: <WaveLeaderProfilePage /> },
          { path: 'settings', element: <WaveLeaderSettingsPage /> },
        ],
      },
    ],
  },

  // Unauthorized page (public)
  {
    path: '/unauthorized',
    element: <PublicLayout />,
    children: [{ index: true, element: <UnauthorizedPage /> }],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
])

