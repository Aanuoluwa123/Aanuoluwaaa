import React from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import BudgetCategories from './components/BudgetCategories';
import ErrorBoundary from './components/ErrorBoundary';

// Main App content with routing
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <Router>
        {user && <Navigation />}
        <main className="container mx-auto px-4 py-8">
          <ErrorBoundary>
            <Routes>
              <Route path="/login" element={
                user ? <Navigate to="/" replace /> : <AuthPage />
              } />
              <Route path="/signup" element={
                user ? <Navigate to="/" replace /> : <AuthPage />
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Dashboard userId={user?.id || ''} />
                </ProtectedRoute>
              } />
              <Route path="/transactions" element={
                <ProtectedRoute>
                  <TransactionHistory userId={user?.id || ''} />
                </ProtectedRoute>
              } />
              <Route path="/add-transaction" element={
                <ProtectedRoute>
                  <TransactionForm userId={user?.id || ''} />
                </ProtectedRoute>
              } />
              <Route path="/budgets" element={
                <ProtectedRoute>
                  <BudgetCategories userId={user?.id || ''} />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </Router>
    </div>
  );
}

// App wrapper that provides the AuthContext
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;