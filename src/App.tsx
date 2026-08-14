import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './lib/auth/AuthContext'
import { UserAdminPage } from './pages/admin/UserAdminPage'
import { AnalyticsPage } from './pages/analytics/AnalyticsPage'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MessagingPage } from './pages/messaging/MessagingPage'
import { OrderForm } from './pages/orders/OrderForm'
import { OrdersPage } from './pages/orders/OrdersPage'
import { TranscriptsPage } from './pages/transcripts/TranscriptsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute page="orders">
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/new"
              element={
                <ProtectedRoute page="orders">
                  <OrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute page="orders">
                  <OrderForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute page="analytics">
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messaging"
              element={
                <ProtectedRoute page="messaging">
                  <MessagingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transcripts"
              element={
                <ProtectedRoute page="transcripts">
                  <TranscriptsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute page="admin">
                  <UserAdminPage />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
