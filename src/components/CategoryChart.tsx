import React, { useEffect, useState } from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { dataService } from '../lib/dataService';
import { formatCurrency } from '../utils';

// Register required Chart.js components
Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CategorySpending {
  id: string;
  name: string;
  spent: number;
  budget: number;
  percentage: number;
  type: 'income' | 'expense';
}

interface CategoryChartProps {
  categories: CategorySpending[];
  type: 'income' | 'expense';
  selectedCurrency: string;
  userId: string;
}

export default function CategoryChart({ categories, type, selectedCurrency, userId }: CategoryChartProps) {
  const [chartData, setChartData] = useState<{
    labels: string[];
    datasets: any[];
  }>({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndProcessData = async () => {
      setLoading(true);
      try {
        // Get all transactions for the user
        const allTransactions = await dataService.getTransactions(userId);
        
        // Filter and process categories
        const processedCategories = await Promise.all(
          categories.map(async (cat) => {
            // Filter transactions for this category and currency
            const categoryTransactions = allTransactions.filter(
              t => t.category_id === cat.id && t.currency === selectedCurrency && t.type === type
            );
            
            // Calculate total spent for this category in the selected currency
            const spent = categoryTransactions.reduce(
              (sum, t) => sum + t.amount, 0
            );
            
            return {
              ...cat,
              spent
            };
          })
        );

        // Filter out categories with no transactions in the selected currency
        const filtered = processedCategories.filter(cat => cat.spent > 0);
        
        // Sort by spent amount
        const sorted = [...filtered].sort((a, b) => b.spent - a.spent);

        // Prepare chart data
        const data = {
          labels: sorted.map(cat => cat.name),
          datasets: [
            {
              label: 'Spent',
              data: sorted.map(cat => cat.spent),
              backgroundColor: type === 'income' 
                ? 'rgba(16, 185, 129, 0.7)' 
                : 'rgba(239, 68, 68, 0.7)',
              borderColor: type === 'income' 
                ? 'rgb(4, 120, 87)' 
                : 'rgb(185, 28, 28)',
              borderWidth: 1
            },
            {
              label: 'Budget',
              data: sorted.map(cat => cat.budget),
              backgroundColor: 'rgba(107, 114, 128, 0.3)',
              borderColor: 'rgb(75, 85, 99)',
              borderWidth: 1
            }
          ]
        };

        setChartData(data);
      } catch (error) {
        console.error('Error fetching category data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndProcessData();
  }, [categories, type, selectedCurrency, userId]);

  // Skip rendering if no categories
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }


  if (chartData.labels.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-lg">No {type} categories found in {selectedCurrency}</p>
        <p className="text-sm mt-1">Add {type} transactions in {selectedCurrency} to see the breakdown</p>
      </div>
    );
  }

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
      <div className={`bg-gradient-to-r ${
        type === 'income' 
          ? 'from-green-600 to-green-500' 
          : 'from-red-600 to-red-500'
      } px-6 py-4`}>
        <h3 className="text-lg font-medium text-white">
          {type === 'income' ? 'Income' : 'Expense'} Category Breakdown
        </h3>
      </div>
      <div className="p-6">
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
} 