import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { supabase, isDevEnvironment } from './lib/supabaseClient';
import Auth from './components/Auth';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import TransactionHistory from './components/TransactionHistory';
import BudgetCategories from './components/BudgetCategories';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import CategoryDistributionChart from './components/CategoryDistributionChart';

// Local storage keys
const SERVER_START_KEY = 'bolt_finance_server_start';
const SESSION_KEY = 'bolt_finance_session';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshData, setRefreshData] = useState(0);
  const [isDevelopmentMode, setIsDevelopmentMode] = useState(false);

  // Handle session change
  const handleSessionChange = (newSession: any) => {
    setSession(newSession);
    
    // If it's a development session, store it in localStorage
    if (newSession && newSession.user && newSession.user.id === 'dev-user-id') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
    }
  };

  useEffect(() => {
    // Check if running in development mode
    const devMode = isDevEnvironment();
    setIsDevelopmentMode(devMode);

    // Save server start time to detect restarts
    const serverStartTime = Date.now();
    localStorage.setItem(SERVER_START_KEY, serverStartTime.toString());

    // Check for development session first
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (devMode && savedSession) {
      try {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession && parsedSession.user && parsedSession.user.id === 'dev-user-id') {
          handleSessionChange(parsedSession);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing saved session:', error);
      }
    }

    // Check for real Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSessionChange(session);
      setLoading(false);
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        handleSessionChange(session);
        
        if (event === 'SIGNED_IN') {
          toast.success('Signed in successfully');
        } else if (event === 'SIGNED_OUT') {
          toast.success('Signed out successfully');
          // Clear development session if exists
          localStorage.removeItem(SESSION_KEY);
        } else if (event === 'PASSWORD_RECOVERY') {
          toast.success('Password reset email sent');
        } else if (event === 'USER_UPDATED') {
          toast.success('User profile updated');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleRefreshData = () => {
    setRefreshData(prev => prev + 1);
  };

  const handleSignOut = async () => {
    // If it's a development session
    if (session && session.user && session.user.id === 'dev-user-id') {
      localStorage.removeItem(SESSION_KEY);
      setSession(null);
      toast.success('Signed out of development account');
      return;
    }
    
    // Otherwise, sign out from Supabase
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast.error('Error signing out: ' + error.message);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Refresh data when switching tabs to ensure latest data is shown
    handleRefreshData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-xl font-medium text-gray-800">Loading your finances...</div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth onAuthChange={handleSessionChange} />;
  }

  // Check if using development account
  const isDevAccount = session.user.id === 'dev-user-id';

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            background: '#333',
            color: '#fff',
          },
        }}
      />
      
      <Navigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        userEmail={session.user.email} 
        onSignOut={handleSignOut}
        isDevAccount={isDevAccount}
      />
      
      <header className="bg-gradient-to-r from-blue-700 to-indigo-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-center md:text-left">
            Income & Expenditure Management
          </h1>
          {isDevAccount && (
            <div className="mt-2 inline-flex items-center bg-yellow-400 text-yellow-800 px-3 py-1 text-xs font-semibold rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Development Mode
            </div>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              userId={session.user.id} 
              key={`dashboard-${refreshData}`}
            />
          )}
          
          {activeTab === 'transactions' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Add Transaction</h2>
                  </div>
                  <div className="p-6">
                    <TransactionForm 
                      userId={session.user.id} 
                      onTransactionAdded={handleRefreshData}
                    />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">Transaction History</h2>
                  </div>
                  <div className="p-6">
                    <TransactionHistory 
                      userId={session.user.id} 
                      onTransactionDeleted={handleRefreshData}
                      key={`history-${refreshData}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'categories' && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white">Budget Categories</h2>
              </div>
              <div className="p-6">
                <BudgetCategories 
                  userId={session.user.id}
                  key={`categories-${refreshData}`}
                />
              </div>
            </div>
          )}
          
          {activeTab === 'reports' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <MonthlyTrendChart userId={session.user.id} />
                <CategoryDistributionChart userId={session.user.id} />
              </div>
              
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Financial Reports</h2>
                </div>
                <div className="p-6">
                  <div className="mb-6 space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Financial Analysis</h3>
                    <p className="text-gray-600">
                      View detailed reports and trends of your financial activity over time.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-medium text-gray-800">Monthly Summary</h4>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">View income and expenses summarized by month</p>
                        <div className="mt-4">
                          <button className="px-3 py-1 text-xs text-orange-600 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100">
                            Coming Soon
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-medium text-gray-800">Category Analysis</h4>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Deep dive into spending patterns by category</p>
                        <div className="mt-4">
                          <button className="px-3 py-1 text-xs text-orange-600 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100">
                            Coming Soon
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-md font-medium text-gray-800">Trend Reports</h4>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">Track how your finances change over time</p>
                        <div className="mt-4">
                          <button className="px-3 py-1 text-xs text-orange-600 border border-orange-200 rounded-md bg-orange-50 hover:bg-orange-100">
                            Coming Soon
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Export Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="bg-blue-100 rounded-full p-2 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800">CSV Export</h4>
                          <p className="text-xs text-gray-500">Download your transaction data as CSV</p>
                        </div>
                        <button className="ml-auto px-3 py-1 text-xs text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50">
                          Export
                        </button>
                      </div>
                      
                      <div className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="bg-red-100 rounded-full p-2 mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800">PDF Report</h4>
                          <p className="text-xs text-gray-500">Generate a PDF financial summary</p>
                        </div>
                        <button className="ml-auto px-3 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50">
                          Generate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white text-center py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <span className="text-xl font-bold">FinanceTracker</span>
              </div>
              <p className="text-gray-400 mt-1">Manage your finances with ease</p>
            </div>
            <div>
              <p>&copy; {new Date().getFullYear()} Income & Expenditure Management System</p>
              <p className="text-sm text-gray-400 mt-1">
                Courtesy: ASHIYANBI AANUOLUWA HIKMAT
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;