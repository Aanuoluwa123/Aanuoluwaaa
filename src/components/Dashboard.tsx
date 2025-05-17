import React, { useState, useEffect } from 'react';
import { Pie, Bar } from 'react-chartjs-2';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
  category_id?: string;
  category?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budget_limit?: number;
}

interface DashboardProps {
  userId: string;
}

// Sample data for development mode
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Salary',
    amount: 3000,
    type: 'income',
    created_at: new Date().toISOString(),
    category_id: '1',
    category: { name: 'Salary' }
  },
  {
    id: '2',
    description: 'Rent',
    amount: 1200,
    type: 'expense',
    created_at: new Date().toISOString(),
    category_id: '2',
    category: { name: 'Housing' }
  },
  {
    id: '3',
    description: 'Groceries',
    amount: 250,
    type: 'expense',
    created_at: new Date().toISOString(),
    category_id: '3',
    category: { name: 'Food' }
  },
  {
    id: '4',
    description: 'Freelance Work',
    amount: 500,
    type: 'income',
    created_at: new Date().toISOString(),
    category_id: '4',
    category: { name: 'Side Hustle' }
  },
  {
    id: '5',
    description: 'Internet Bill',
    amount: 60,
    type: 'expense',
    created_at: new Date().toISOString(),
    category_id: '5',
    category: { name: 'Utilities' }
  }
];

const sampleCategories: Category[] = [
  { id: '1', name: 'Salary', type: 'income' },
  { id: '4', name: 'Side Hustle', type: 'income' },
  { id: '2', name: 'Housing', type: 'expense', budget_limit: 1500 },
  { id: '3', name: 'Food', type: 'expense', budget_limit: 400 },
  { id: '5', name: 'Utilities', type: 'expense', budget_limit: 200 }
];

export default function Dashboard({ userId }: DashboardProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');
  const [spendingLimit, setSpendingLimit] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
    setIsDevelopment(isDevEnvironment);

    if (userId) {
      if (isDevEnvironment && userId === 'dev-user-id') {
        // Use sample data in development mode
        setTransactions(sampleTransactions);
        setCategories(sampleCategories);
        setLoading(false);
      } else {
        fetchTransactions();
        fetchCategories();
      }
    }
  }, [userId, timeframe]);

  async function fetchTransactions() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('transactions')
        .select('*, category:categories(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      // Filter by timeframe
      const now = new Date();
      let startDate;
      
      if (timeframe === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'month') {
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeframe === 'year') {
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please check your connection or try again later.');
      toast.error('Error loading transactions');
      
      // Use sample data as fallback in development mode
      if (isDevelopment) {
        setTransactions(sampleTransactions);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      
      // Use sample data as fallback in development mode
      if (isDevelopment) {
        setCategories(sampleCategories);
      }
    }
  }

  // Calculate financial metrics
  const balance = transactions.reduce((acc, curr) => 
    curr.type === 'income' ? acc + curr.amount : acc - curr.amount, 0
  );

  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Group transactions by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense' && t.category)
    .reduce((acc: Record<string, number>, curr) => {
      const categoryName = curr.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + curr.amount;
      return acc;
    }, {});

  const incomeByCategory = transactions
    .filter(t => t.type === 'income' && t.category)
    .reduce((acc: Record<string, number>, curr) => {
      const categoryName = curr.category?.name || 'Uncategorized';
      acc[categoryName] = (acc[categoryName] || 0) + curr.amount;
      return acc;
    }, {});

  // Check budget limits
  const categoryBudgets = categories
    .filter(c => c.type === 'expense' && c.budget_limit)
    .map(category => {
      const spent = transactions
        .filter(t => t.category_id === category.id)
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: category.name,
        limit: category.budget_limit || 0,
        spent,
        remaining: (category.budget_limit || 0) - spent,
        percentage: category.budget_limit ? (spent / category.budget_limit) * 100 : 0
      };
    });

  // Chart data
  const pieData = {
    labels: ['Income', 'Expenses'],
    datasets: [{
      data: [incomeTotal, expenseTotal],
      backgroundColor: ['#4CAF50', '#F44336'],
      borderColor: ['#43A047', '#E53935'],
      borderWidth: 1
    }]
  };

  const expenseCategoriesData = {
    labels: Object.keys(expensesByCategory),
    datasets: [{
      label: 'Expenses by Category',
      data: Object.values(expensesByCategory),
      backgroundColor: [
        '#F44336', '#2196F3', '#FFEB3B', '#4CAF50', '#9C27B0',
        '#FF9800', '#795548', '#607D8B', '#E91E63', '#00BCD4'
      ]
    }]
  };

  const incomeCategoriesData = {
    labels: Object.keys(incomeByCategory),
    datasets: [{
      label: 'Income by Category',
      data: Object.values(incomeByCategory),
      backgroundColor: [
        '#4CAF50', '#8BC34A', '#CDDC39', '#00BCD4', '#03A9F4',
        '#3F51B5', '#673AB7', '#009688', '#4DB6AC', '#81C784'
      ]
    }]
  };

  const budgetComparisonData = {
    labels: categoryBudgets.map(b => b.name),
    datasets: [
      {
        label: 'Budget Limit',
        data: categoryBudgets.map(b => b.limit),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      },
      {
        label: 'Actual Spending',
        data: categoryBudgets.map(b => b.spent),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgb(255, 99, 132)',
        borderWidth: 1
      }
    ]
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (error && !isDevelopment) {
    return (
      <div className="bg-white p-6 rounded shadow">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          <h3 className="text-lg font-medium">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => {
              fetchTransactions();
              fetchCategories();
            }}
            className="mt-2 bg-red-100 hover:bg-red-200 text-red-700 py-1 px-3 rounded"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Financial Dashboard</h2>
      
      {isDevelopment && userId === 'dev-user-id' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium">Development Mode</p>
          <p>Using sample data for demonstration purposes</p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Summary</h3>
          <div className="flex space-x-2">
            <button 
              onClick={() => setTimeframe('week')} 
              className={`px-3 py-1 rounded ${timeframe === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeframe('month')} 
              className={`px-3 py-1 rounded ${timeframe === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeframe('year')} 
              className={`px-3 py-1 rounded ${timeframe === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              Year
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className={`p-4 rounded-lg ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <h4 className="text-sm font-medium text-gray-500">BALANCE</h4>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">TOTAL INCOME</h4>
            <p className="text-2xl font-bold text-blue-600">${incomeTotal.toFixed(2)}</p>
          </div>
          
          <div className="bg-amber-100 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-500">TOTAL EXPENSES</h4>
            <p className="text-2xl font-bold text-amber-600">${expenseTotal.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Income vs Expenses</h3>
          <div className="h-64">
            <Pie data={pieData} />
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">Spending by Category</h3>
          {Object.keys(expensesByCategory).length > 0 ? (
            <div className="h-64">
              <Pie data={expenseCategoriesData} />
            </div>
          ) : (
            <p className="text-gray-500 italic">No expense data available</p>
          )}
        </div>
      </div>
      
      {categoryBudgets.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-4">Budget vs Actual</h3>
          <div className="h-80">
            <Bar 
              data={budgetComparisonData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Budget Status</h3>
        {categoryBudgets.length > 0 ? (
          <div className="space-y-4">
            {categoryBudgets.map((budget, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{budget.name}</span>
                  <span className="text-gray-600">
                    ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      budget.percentage > 100 ? 'bg-red-600' : 
                      budget.percentage > 80 ? 'bg-amber-500' : 'bg-green-600'
                    }`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {budget.percentage > 100 ? (
                    <span className="text-red-600">Over budget by ${(budget.spent - budget.limit).toFixed(2)}</span>
                  ) : (
                    <span>${budget.remaining.toFixed(2)} remaining</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">No budget categories set up yet</p>
        )}
      </div>
    </div>
  );
} 