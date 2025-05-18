import React, { useEffect, useRef } from 'react';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register required Chart.js components
Chart.register(ArcElement, Tooltip, Legend);

interface FinancialChartProps {
  totalIncome: number;
  totalExpenses: number;
}

export default function FinancialChart({ totalIncome, totalExpenses }: FinancialChartProps) {
  // Prepare data for the chart
  const data = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [totalIncome, totalExpenses],
        backgroundColor: ['#10B981', '#EF4444'],
        borderColor: ['#047857', '#B91C1C'],
        borderWidth: 1,
        hoverOffset: 4
      }
    ]
  };

  // Chart options
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: $${value.toFixed(2)}`;
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4">
        <h3 className="text-lg font-medium text-white">Income vs Expenses</h3>
      </div>
      <div className="p-6">
        <div className="relative h-64">
          <Doughnut data={data} options={options} />
          {totalIncome === 0 && totalExpenses === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500 text-center">No financial data to display</p>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-sm text-gray-500">Balance</p>
              <p className={`text-2xl font-bold ${totalIncome >= totalExpenses ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(totalIncome - totalExpenses).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                {totalIncome >= totalExpenses ? 'Positive' : 'Negative'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 