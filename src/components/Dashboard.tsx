import React, { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { Transaction } from '../lib/localStorage';
import { eventBus, EVENTS } from '../lib/eventBus';
import FinancialChart from './FinancialChart';
import CategoryChart from './CategoryChart';

interface DashboardProps {
  userId: string;
}

interface CategorySpending {
  id: string;
  name: string;
  spent: number;
  budget: number;
  percentage: number;
  type: 'income' | 'expense';
}

interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categorySpending: CategorySpending[];
  recentTransactions: Transaction[];
}

export default function Dashboard({ userId }: DashboardProps) {
  const [data, setData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    categorySpending: [],
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to events that should trigger a dashboard refresh
    const createTransactionUnsubscribe = eventBus.on(EVENTS.TRANSACTION_CREATED, handleDataChange);
    const deleteTransactionUnsubscribe = eventBus.on(EVENTS.TRANSACTION_DELETED, handleDataChange);
    const createCategoryUnsubscribe = eventBus.on(EVENTS.CATEGORY_CREATED, handleDataChange);
    const updateCategoryUnsubscribe = eventBus.on(EVENTS.CATEGORY_UPDATED, handleDataChange);
    const deleteCategoryUnsubscribe = eventBus.on(EVENTS.CATEGORY_DELETED, handleDataChange);
    
    return () => {
      createTransactionUnsubscribe();
      deleteTransactionUnsubscribe();
      createCategoryUnsubscribe();
      updateCategoryUnsubscribe();
      deleteCategoryUnsubscribe();
    };
  }, [userId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboardData = await dataService.getDashboardData(userId);
      setData(dashboardData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataChange = () => {
    fetchDashboardData();
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Calculate percentage for progress bars
  const getProgressBarWidth = (percentage: number) => {
    if (percentage > 100) return '100%';
    return `${percentage}%`;
  };

  // Get color for progress bars
  const getProgressBarColor = (percentage: number, type: 'income' | 'expense') => {
    if (type === 'income') {
      return 'bg-green-500';
    } else {
      if (percentage >= 90) return 'bg-red-500';
      if (percentage >= 75) return 'bg-yellow-500';
      return 'bg-blue-500';
    }
  };

  // Filter categories by type
  const expenseCategories = data.categorySpending.filter(cat => cat.type === 'expense');
  const incomeCategories = data.categorySpending.filter(cat => cat.type === 'income');

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex justify-center py-12">
          <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Total Income</h3>
              </div>
              <div className="p-6 flex items-center">
                <div className="bg-green-100 rounded-full p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalIncome)}</div>
                  <div className="text-sm text-gray-500">Total income received</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Total Expenses</h3>
              </div>
              <div className="p-6 flex items-center">
                <div className="bg-red-100 rounded-full p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalExpenses)}</div>
                  <div className="text-sm text-gray-500">Total expenses paid</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Current Balance</h3>
              </div>
              <div className="p-6 flex items-center">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <div className={`text-3xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(data.balance)}
                  </div>
                  <div className="text-sm text-gray-500">Available balance</div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FinancialChart 
              totalIncome={data.totalIncome} 
              totalExpenses={data.totalExpenses} 
            />
            
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Financial Summary</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Income vs Expenses</span>
                      <span>
                        {data.totalIncome > 0 
                          ? ((data.totalExpenses / data.totalIncome) * 100).toFixed(0) 
                          : "0"}% of income spent
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="h-2.5 rounded-full bg-indigo-500"
                        style={{ 
                          width: data.totalIncome > 0 
                            ? `${Math.min((data.totalExpenses / data.totalIncome) * 100, 100)}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="border border-gray-100 rounded-lg p-4 bg-green-50">
                      <div className="text-sm text-gray-500">Remaining Budget</div>
                      <div className={`text-xl font-bold ${data.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(data.balance >= 0 ? data.balance : 0)}
                      </div>
                    </div>
                    <div className="border border-gray-100 rounded-lg p-4 bg-red-50">
                      <div className="text-sm text-gray-500">Overspent</div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCurrency(data.balance < 0 ? Math.abs(data.balance) : 0)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Budget Progress - Expense Categories */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
              <h3 className="text-lg font-medium text-white">Expense Budget Progress</h3>
            </div>
            <div className="p-6">
              {expenseCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg">No expense categories found</p>
                  <p className="text-sm mt-1">Create expense categories to track your spending</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {expenseCategories.map(category => (
                    <div key={category.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium text-gray-700">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${getProgressBarColor(category.percentage, category.type)}`}
                          style={{ width: getProgressBarWidth(category.percentage) }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <div className="text-xs text-gray-500">
                          {category.percentage > 100 ? (
                            <span className="text-red-600 font-medium">Over budget!</span>
                          ) : (
                            <span>{category.percentage.toFixed(0)}% used</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatCurrency(category.budget - category.spent)} remaining
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Budget Progress - Income Categories */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
              <h3 className="text-lg font-medium text-white">Income Budget Progress</h3>
            </div>
            <div className="p-6">
              {incomeCategories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg">No income categories found</p>
                  <p className="text-sm mt-1">Create income categories to track your earnings</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {incomeCategories.map(category => (
                    <div key={category.id}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium text-gray-700">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(category.spent)} / {category.budget > 0 ? formatCurrency(category.budget) : 'No target'}
                        </div>
                      </div>
                      {category.budget > 0 && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`h-2.5 rounded-full ${getProgressBarColor(category.percentage, category.type)}`}
                              style={{ width: getProgressBarWidth(category.percentage) }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <div className="text-xs text-gray-500">
                              <span>{category.percentage.toFixed(0)}% of target</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {category.spent >= category.budget ? (
                                <span className="text-green-600 font-medium">Target reached!</span>
                              ) : (
                                <span>{formatCurrency(category.budget - category.spent)} to target</span>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Category Charts */}
          {(expenseCategories.length > 0 || incomeCategories.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {expenseCategories.length > 0 && (
                <CategoryChart categories={expenseCategories} type="expense" />
              )}
              {incomeCategories.length > 0 && (
                <CategoryChart categories={incomeCategories} type="income" />
              )}
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 px-6 py-4">
              <h3 className="text-lg font-medium text-white">Recent Transactions</h3>
            </div>
            <div className="p-6">
              {data.recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-lg">No transactions yet</p>
                  <p className="text-sm mt-1">Add transactions to see them here</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {data.recentTransactions.map(transaction => (
                    <div key={transaction.id} className="py-4 flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'income' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                          <div className="text-xs text-gray-500">{formatDate(transaction.created_at)}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 