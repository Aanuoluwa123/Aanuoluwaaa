import React, { useEffect, useState } from 'react';
import { Chart, LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { dataService } from '../lib/dataService';
import { Transaction } from '../lib/localStorage';
import { formatCurrency } from '../utils';

// Register required Chart.js components
Chart.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

interface MonthlyTrendChartProps {
  userId: string;
  selectedCurrency: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
}

export default function MonthlyTrendChart({ userId, selectedCurrency }: MonthlyTrendChartProps) {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    fetchTransactions();
  }, [userId, selectedCurrency]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      // Get all transactions
      const transactions = await dataService.getTransactions(userId);
      
      // Process transactions into monthly data
      const monthlyData = processTransactionsByMonth(transactions);
      setMonthlyData(monthlyData);
    } catch (error) {
      console.error('Error fetching transactions for monthly trend:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTransactionsByMonth = (transactions: Transaction[]): MonthlyData[] => {
    // Group transactions by month and currency
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    
    // Get current date and calculate last 6 months
    const today = new Date();
    const months: { key: string; name: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
      const monthName = month.toLocaleString('default', { month: 'short' });
      months.push({ key: monthKey, name: monthName });
      
      // Initialize monthly data
      monthlyMap.set(monthKey, { income: 0, expenses: 0 });
    }
    
    // Aggregate transactions by month
    transactions
      .filter(transaction => transaction.currency === selectedCurrency)
      .forEach(transaction => {
        const date = new Date(transaction.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)!;
          if (transaction.type === 'income') {
            monthData.income += transaction.amount;
          } else {
            monthData.expenses += transaction.amount;
          }
          monthlyMap.set(monthKey, monthData);
        }
      });
    
    // Convert map to array
    return months.map(month => ({
      month: month.name,
      ...monthlyMap.get(month.key)!
    }));
  };

  // Chart data
  const data = {
    labels: monthlyData.map(item => item.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyData.map(item => item.income),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.3
      },
      {
        label: 'Expenses',
        data: monthlyData.map(item => item.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        tension: 0.3
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value, selectedCurrency);
          }
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${formatCurrency(value, selectedCurrency)}`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4">
        <h3 className="text-lg font-medium text-white">Monthly Trends (Last 6 Months)</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : monthlyData.every(month => month.income === 0 && month.expenses === 0) ? (
          <div className="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-lg">No transaction data available</p>
            <p className="text-sm mt-1">Add transactions to see monthly trends</p>
          </div>
        ) : (
          <div className="h-80">
            <Line data={data} options={options} />
          </div>
        )}
      </div>
    </div>
  );
} 