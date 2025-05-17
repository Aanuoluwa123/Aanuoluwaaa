import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabaseClient';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import BudgetCategories from './components/BudgetCategories';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshData, setRefreshData] = useState(0);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Check if running in development mode
    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
    setIsDevelopment(isDevEnvironment);

    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleRefreshData = () => {
    setRefreshData(prev => prev + 1);
  };

  const handleSignOut = () => {
    setSession(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthChange={setSession} />;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Toaster position="top-right" />
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userEmail={session.user.email} 
        onSignOut={handleSignOut}
      />
      
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-center md:text-left">
            Income & Expenditure Management
          </h1>
          {isDevelopment && (
            <div className="bg-yellow-500 text-black px-3 py-1 text-xs rounded mt-2 inline-block">
              Development Mode
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {activeTab === 'dashboard' && (
            <Dashboard 
              userId={session.user.id} 
              key={`dashboard-${refreshData}`}
            />
          )}
          
          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <TransactionForm 
                  userId={session.user.id} 
                  onTransactionAdded={handleRefreshData}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionHistory 
                  userId={session.user.id} 
                  onTransactionDeleted={handleRefreshData}
                  key={`history-${refreshData}`}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'categories' && (
            <BudgetCategories 
              userId={session.user.id}
              key={`categories-${refreshData}`}
            />
          )}
          
          {activeTab === 'reports' && (
            <div className="bg-white p-6 rounded shadow">
              <h2 className="text-2xl font-bold mb-4">Financial Reports</h2>
              <Dashboard 
                userId={session.user.id} 
                key={`reports-${refreshData}`}
              />
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-200 text-center p-4 mt-6">
        <div className="max-w-7xl mx-auto">
          <p>&copy; {new Date().getFullYear()} Income & Expenditure Management System</p>
          <p className="text-sm text-gray-600 mt-1">
            Courtesy: ASHIYANBI AANUOLUWA HIKMAT
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;