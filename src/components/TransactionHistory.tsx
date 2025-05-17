import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at: string;
  category?: {
    name: string;
  };
}

interface TransactionHistoryProps {
  userId: string;
  onTransactionDeleted?: () => void;
}

// Sample transactions for development mode
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Salary',
    amount: 3000,
    type: 'income',
    created_at: new Date().toISOString(),
    category: { name: 'Salary' }
  },
  {
    id: '2',
    description: 'Rent',
    amount: 1200,
    type: 'expense',
    created_at: new Date().toISOString(),
    category: { name: 'Housing' }
  },
  {
    id: '3',
    description: 'Groceries',
    amount: 250,
    type: 'expense',
    created_at: new Date().toISOString(),
    category: { name: 'Food' }
  },
  {
    id: '4',
    description: 'Freelance Work',
    amount: 500,
    type: 'income',
    created_at: new Date().toISOString(),
    category: { name: 'Side Hustle' }
  },
  {
    id: '5',
    description: 'Internet Bill',
    amount: 60,
    type: 'expense',
    created_at: new Date().toISOString(),
    category: { name: 'Utilities' }
  }
];

export default function TransactionHistory({ userId, onTransactionDeleted }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
    setIsDevelopment(isDevEnvironment);

    if (userId) {
      fetchTransactions();
    }
  }, [userId, filter, sortBy, sortOrder]);

  async function fetchTransactions() {
    setLoading(true);
    try {
      if (isDevelopment && userId === 'dev-user-id') {
        // Filter and sort sample transactions for development mode
        let filteredTransactions = [...sampleTransactions];
        
        if (filter !== 'all') {
          filteredTransactions = filteredTransactions.filter(t => t.type === filter);
        }
        
        // Sort transactions
        filteredTransactions.sort((a, b) => {
          if (sortBy === 'date') {
            return sortOrder === 'asc' 
              ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          } else {
            return sortOrder === 'asc' 
              ? a.amount - b.amount
              : b.amount - a.amount;
          }
        });
        
        setTransactions(filteredTransactions);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('transactions')
        .select('*, category:categories(name)')
        .eq('user_id', userId);
      
      if (filter !== 'all') {
        query = query.eq('type', filter);
      }
      
      if (sortBy === 'date') {
        query = query.order('created_at', { ascending: sortOrder === 'asc' });
      } else if (sortBy === 'amount') {
        query = query.order('amount', { ascending: sortOrder === 'asc' });
      }
      
      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error('Error loading transactions: ' + error.message);
      
      if (isDevelopment) {
        // Use sample data in development mode
        setTransactions(sampleTransactions);
      }
    } finally {
      setLoading(false);
    }
  }

  async function deleteTransaction(id: string) {
    try {
      if (isDevelopment && userId === 'dev-user-id') {
        // Simulate deleting a transaction in development mode
        setTransactions(transactions.filter(t => t.id !== id));
        toast.success('Transaction deleted');
        
        if (onTransactionDeleted) {
          onTransactionDeleted();
        }
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(transactions.filter(t => t.id !== id));
      toast.success('Transaction deleted');
      
      if (onTransactionDeleted) {
        onTransactionDeleted();
      }
    } catch (error: any) {
      toast.error('Error deleting transaction: ' + error.message);
    }
  }

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.category?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
      
      {isDevelopment && userId === 'dev-user-id' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium">Development Mode</p>
          <p>Using sample transaction data</p>
        </div>
      )}
      
      <div className="mb-4 space-y-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex space-x-2">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('income')} 
              className={`px-3 py-1 rounded ${filter === 'income' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
            >
              Income
            </button>
            <button 
              onClick={() => setFilter('expense')} 
              className={`px-3 py-1 rounded ${filter === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
            >
              Expenses
            </button>
          </div>
          
          <div className="flex space-x-2">
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as ['date' | 'amount', 'asc' | 'desc'];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="px-3 py-1 border rounded"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        </div>
        
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search transactions..."
          className="w-full p-2 border rounded"
        />
      </div>
      
      {loading ? (
        <div className="text-center py-4">Loading transactions...</div>
      ) : (
        <>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchTerm ? 'No transactions match your search' : 'No transactions found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-2">{formatDate(transaction.created_at)}</td>
                      <td className="p-2">{transaction.description}</td>
                      <td className="p-2">{transaction.category?.name || 'Uncategorized'}</td>
                      <td className={`p-2 font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Delete transaction"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
} 