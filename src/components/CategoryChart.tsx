import React from 'react';
import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

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
}

export default function CategoryChart({ categories, type }: CategoryChartProps) {
  // Skip rendering if no categories
  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
        <p className="text-lg">No {type} categories found</p>
        <p className="text-sm mt-1">Create {type} categories to see a visual breakdown</p>
      </div>
    );
  }

  // Sort categories by spent amount in descending order
  const sortedCategories = [...categories].sort((a, b) => b.spent - a.spent);

  // Prepare data for the chart
  const data = {
    labels: sortedCategories.map(cat => cat.name),
    datasets: [
      {
        label: 'Spent',
        data: sortedCategories.map(cat => cat.spent),
        backgroundColor: type === 'income' ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)',
        borderColor: type === 'income' ? 'rgb(4, 120, 87)' : 'rgb(185, 28, 28)',
        borderWidth: 1
      },
      {
        label: 'Budget',
        data: sortedCategories.map(cat => cat.budget),
        backgroundColor: 'rgba(107, 114, 128, 0.3)',
        borderColor: 'rgb(75, 85, 99)',
        borderWidth: 1
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
            return '$' + value;
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
            return `${label}: $${value.toFixed(2)}`;
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
          <Bar data={data} options={options} />
        </div>
      </div>
    </div>
  );
} 