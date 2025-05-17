import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface TransactionFormProps {
  userId: string;
  onTransactionAdded: () => void;
}

// Sample categories for development mode
const sampleCategories: Category[] = [
  { id: '1', name: 'Salary', type: 'income' },
  { id: '4', name: 'Side Hustle', type: 'income' },
  { id: '2', name: 'Housing', type: 'expense' },
  { id: '3', name: 'Food', type: 'expense' },
  { id: '5', name: 'Utilities', type: 'expense' }
];

export default function TransactionForm({ userId, onTransactionAdded }: TransactionFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
    setIsDevelopment(isDevEnvironment);

    if (userId) {
      fetchCategories();
    }
  }, [userId, type]);

  async function fetchCategories() {
    try {
      if (isDevelopment && userId === 'dev-user-id') {
        // Filter sample categories based on selected type
        const filteredCategories = sampleCategories.filter(c => c.type === type);
        setCategories(filteredCategories);
        setCategoryId('');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
      // Reset category selection when type changes
      setCategoryId('');
    } catch (error: any) {
      toast.error('Error loading categories: ' + error.message);
      
      if (isDevelopment) {
        // Use sample data in development mode
        const filteredCategories = sampleCategories.filter(c => c.type === type);
        setCategories(filteredCategories);
        setCategoryId('');
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isDevelopment && userId === 'dev-user-id') {
        // Simulate adding a transaction in development mode
        toast.success(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
        setDescription('');
        setAmount('');
        setCategoryId('');
        onTransactionAdded();
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            description,
            amount: Number(amount),
            type,
            category_id: categoryId || null,
            user_id: userId
          }
        ])
        .select();

      if (error) throw error;
      
      if (data) {
        toast.success(`${type === 'income' ? 'Income' : 'Expense'} added successfully`);
        setDescription('');
        setAmount('');
        setCategoryId('');
        onTransactionAdded();
      }
    } catch (error: any) {
      toast.error('Error adding transaction: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add Transaction</h2>
      
      {isDevelopment && userId === 'dev-user-id' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium">Development Mode</p>
          <p>Transactions will not be saved to a database</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            id="description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What was this transaction for?"
            required
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            min="0.01"
            step="0.01"
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'income' | 'expense')}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Select a category --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              No {type} categories found. Please create a category first.
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition duration-200 disabled:bg-gray-400"
        >
          {loading ? 'Adding...' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
} 