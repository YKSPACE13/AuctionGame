import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/auth/Login'
import AdminLogin from './pages/auth/AdminLogin'
import Dashboard from './pages/user/Dashboard'
import Auction from './pages/user/Auction'
import Wallet from './pages/user/Wallet'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import Home from './pages/Home'
import Footer from './components/Footer'

// Lightweight placeholders to avoid missing files if they don't exist yet
const AdminAuctions = () => (
  <div className="min-h-screen bg-gray-900 text-white p-8">
    <h1 className="text-3xl font-bold mb-4">Manage Auctions</h1>
    <p className="text-gray-300">Create, edit, pause, and delete auctions.</p>
  </div>
)

const AuctionForm = () => (
  <div className="min-h-screen bg-gray-900 text-white p-8">
    <h1 className="text-3xl font-bold mb-4">Auction Form</h1>
    <p className="text-gray-300">Create or edit an auction.</p>
  </div>
)

const Signup = () => (
  <div className="min-h-screen bg-gray-900 text-white p-8">
    <h1 className="text-3xl font-bold mb-4">Signup</h1>
    <p className="text-gray-300">Signup flow can be implemented here.</p>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <div className="flex-1">
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* User protected */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/auction/:id" element={
                <ProtectedRoute>
                  <Auction />
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />

              {/* Admin protected */}
              <Route path="/admin/dashboard" element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } />
              <Route path="/admin/auctions" element={
                <AdminRoute>
                  <AdminAuctions />
                </AdminRoute>
              } />
              <Route path="/admin/auctions/new" element={
                <AdminRoute>
                  <AuctionForm />
                </AdminRoute>
              } />
              <Route path="/admin/auctions/edit/:id" element={
                <AdminRoute>
                  <AuctionForm />
                </AdminRoute>
              } />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
