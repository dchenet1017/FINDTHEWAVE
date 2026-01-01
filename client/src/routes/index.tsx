import { createBrowserRouter } from 'react-router-dom'
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

// Dashboard pages
import UserDashboard from '@/pages/dashboard/UserDashboard'
import ProfilePage from '@/pages/dashboard/ProfilePage'
import UserMapPage from '@/pages/dashboard/UserMapPage'
import MyPlacesPage from '@/pages/dashboard/MyPlacesPage'

// Admin pages
import AdminDashboard from '@/pages/admin/AdminDashboard'
import UserManagement from '@/pages/admin/users/UserManagement'
import BusinessManagement from '@/pages/admin/businesses/BusinessManagement'
import BusinessDetail from '@/pages/admin/businesses/BusinessDetail'
import WaveLeaderManagement from '@/pages/admin/waveleaders/WaveLeaderManagement'
import WaveLeaderDetail from '@/pages/admin/waveleaders/WaveLeaderDetail'
import AnalyticsOverview from '@/pages/admin/analytics/AnalyticsOverview'
import AdminSettings from '@/pages/admin/settings/AdminSettings'
import AdminMapPage from '@/pages/admin/AdminMapPage'

// Business pages
import BusinessDashboard from '@/pages/business/BusinessDashboard'
import BusinessMapPage from '@/pages/business/BusinessMapPage'

// WaveLeader pages
import WaveLeaderDashboard from '@/pages/waveleader/WaveLeaderDashboard'

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
        path: '',
        element: <MainLayout />,
        children: [
          { path: 'map', element: <MapPage /> },
          { path: 'business/:id', element: <BusinessDetailPage /> },
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
          { path: 'profile', element: <ProfilePage /> },
          { path: 'map', element: <UserMapPage /> },
          { path: 'explore', element: <UserMapPage /> },
          { path: 'places', element: <MyPlacesPage /> },
          { path: 'settings', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Settings</h1></div> },
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
          { path: 'analytics', element: <AnalyticsOverview /> },
          { path: 'map', element: <AdminMapPage /> },
          { path: 'settings', element: <AdminSettings /> },
        ],
      },
    ],
  },

  // Business routes
  {
    path: '/business',
    element: <ProtectedRoute allowedRoles={['BUSINESS', 'ADMIN']} />,
    children: [
      {
        element: <BusinessLayout />,
        children: [
          { path: 'dashboard', element: <BusinessDashboard /> },
              { path: 'map', element: <BusinessMapPage /> },
              { path: 'analytics/map', element: <BusinessMapPage /> },
          { path: 'events', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Events</h1></div> },
          { path: 'analytics', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Analytics</h1></div> },
          { path: 'settings', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Business Settings</h1></div> },
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
          { path: 'bookings', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Bookings</h1></div> },
          { path: 'earnings', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Earnings</h1></div> },
          { path: 'settings', element: <div className="p-6"><h1 className="text-3xl font-bold text-white">Wave Leader Settings</h1></div> },
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

