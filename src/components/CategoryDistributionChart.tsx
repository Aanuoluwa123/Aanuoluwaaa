import React, { useEffect, useState } from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { dataService } from '../lib/dataService';
import { Category } from '../lib/localStorage';

// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

interface CategoryDistributionChartProps {
  userId: string;
}

interface CategoryData {
  name: string;
  spent: number;
}

// Color palette for the pie chart
const COLORS = [
  'rgba(239, 68, 68, 0.8)',   // Red
  'rgba(249, 115, 22, 0.8)',  // Orange
  'rgba(245, 158, 11, 0.8)',  // Amber
  'rgba(16, 185, 129, 0.8)',  // Green
  'rgba(6, 182, 212, 0.8)',   // Cyan
  'rgba(59, 130, 246, 0.8)',  // Blue
  'rgba(124, 58, 237, 0.8)',  // Purple
  'rgba(236, 72, 153, 0.8)',  // Pink
];

export default function CategoryDistributionChart({ userId }: CategoryDistributionChartProps) {
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);

  useEffect(() => {
    fetchCategoryData();
  }, [userId]);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      // Get dashboard data which includes category spending
      const dashboardData = await dataService.getDashboardData(userId);
      
      // Filter for expense categories and transform data
      const expenseCategories = dashboardData.categorySpending
        .filter(cat => cat.type === 'expense' && cat.spent > 0)
        .map(cat => ({
          name: cat.name,
          spent: cat.spent
        }));
      
      setCategoryData(expenseCategories);
    } catch (error) {
      console.error('Error fetching category distribution data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data
  const data = {
    labels: categoryData.map(cat => cat.name),
    datasets: [
      {
        data: categoryData.map(cat => cat.spent),
        backgroundColor: categoryData.map((_, index) => COLORS[index % COLORS.length]),
        borderColor: categoryData.map((_, index) => COLORS[index % COLORS.length].replace('0.8', '1')),
        borderWidth: 1,
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4">
        <h3 className="text-lg font-medium text-white">Expense Distribution</h3>
      </div>
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-orange-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : categoryData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm0-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-lg">No expense data available</p>
            <p className="text-sm mt-1">Add transactions to see expense distribution</p>
          </div>
        ) : (
          <div className="h-80">
            <Pie data={data} options={options} />
          </div>
        )}
      </div>
    </div>
  );
} 