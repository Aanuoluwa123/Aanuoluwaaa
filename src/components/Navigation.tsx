import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { MenuIcon, CloseIcon, DashboardIcon, TransactionsIcon, CategoriesIcon, LogoutIcon, FintrLogo } from './ui/Icons';

export default function Navigation() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'dashboard';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  if (!user) return null; // Don't render navigation if user is not logged in

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Error signing out: ' + error.message);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(`/${path}`);
  };

  const navigation = [
    { 
      id: 'dashboard', 
      name: 'Dashboard',
      icon: <DashboardIcon />,
      path: ''
    },
    {
      id: 'transactions',
      name: 'Transactions',
      icon: <TransactionsIcon />,
      path: 'transactions'
    },
    {
      id: 'budgets',
      name: 'Budgets',
      icon: <CategoriesIcon />,
      path: 'budgets'
    }
  ];

  return (
    <nav className="bg-primary-700 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <FintrLogo className="h-8 w-8 text-white mr-2" />
              <span className="text-xl font-bold text-white">Fintr</span>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-1">
              {navigation.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.path)}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${
                    activeTab === item.id || 
                    (item.id === 'dashboard' && activeTab === '')
                      ? 'bg-primary-600 text-white'
                      : 'text-primary-100 hover:bg-primary-600 hover:bg-opacity-75'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-sm text-primary-200 mr-4 ml-2">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                <LogoutIcon className="h-4 w-4 mr-1" />
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-primary-200 hover:text-white hover:bg-primary-600 focus:outline-none"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-primary-700">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleNavigation(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  activeTab === item.id || 
                  (item.id === 'dashboard' && activeTab === '')
                    ? 'bg-primary-600 text-white'
                    : 'text-white hover:bg-primary-600 hover:bg-opacity-75'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </button>
            ))}
          </div>
          
          <div className="pt-4 pb-3 border-t border-primary-600">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user.email}
                </div>
                <div className="text-sm font-medium text-primary-200">
                  View profile
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full px-4 py-2 text-base font-medium text-primary-100 hover:bg-primary-600 hover:text-white"
              >
                <LogoutIcon className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
