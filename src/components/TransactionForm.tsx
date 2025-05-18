import React, { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { Category, Transaction } from '../lib/localStorage';
import { eventBus, EVENTS } from '../lib/eventBus';
import { toast } from 'react-hot-toast';

interface TransactionFormProps {
  userId: string;
  onTransactionAdded?: () => void;
}

export default function TransactionForm({ userId, onTransactionAdded }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: 'expense',
    category_id: '',
  });

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
    
    // Subscribe to category events to keep dropdown updated
    const createUnsubscribe = eventBus.on(EVENTS.CATEGORY_CREATED, handleCategoryChange);
    const updateUnsubscribe = eventBus.on(EVENTS.CATEGORY_UPDATED, handleCategoryChange);
    const deleteUnsubscribe = eventBus.on(EVENTS.CATEGORY_DELETED, handleCategoryChange);
    
    return () => {
      createUnsubscribe();
      updateUnsubscribe();
      deleteUnsubscribe();
    };
  }, [userId]);

  const fetchCategories = async () => {
    try {
      const data = await dataService.getCategories(userId);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryChange = () => {
    fetchCategories();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setTransaction({
      ...transaction,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'income' | 'expense';
    
    setTransaction({
      ...transaction,
      type: newType,
      // Clear category if switching types
      category_id: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transaction.description) {
      toast.error('Description is required');
      return;
    }
    
    if (!transaction.amount || transaction.amount <= 0) {
      toast.error('Amount must be greater than zero');
      return;
    }
    
    setLoading(true);
    
    try {
      const transactionToSave: Transaction = {
        ...transaction as Transaction,
        id: '',
        user_id: userId,
        created_at: new Date().toISOString()
      };
      
      await dataService.saveTransaction(transactionToSave);
      toast.success('Transaction added successfully');
      
      // Reset form
      setTransaction({
        description: '',
        amount: 0,
        type: 'expense',
        category_id: '',
      });
      
      // Notify parent component
      if (onTransactionAdded) {
        onTransactionAdded();
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by transaction type
  const filteredCategories = categories.filter(cat => cat.type === transaction.type);

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={transaction.description}
            onChange={handleInputChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="What was this transaction for?"
            required
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">$</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={transaction.amount || ''}
              onChange={handleInputChange}
              min="0.01"
              step="0.01"
              className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0.00"
              required
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <select
            id="type"
            name="type"
            value={transaction.type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <div className="relative">
            <select
              id="category_id"
              name="category_id"
              value={transaction.category_id || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a category --</option>
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No {transaction.type} categories available
                </option>
              )}
            </select>
            {filteredCategories.length === 0 && (
              <div className="mt-1 text-xs text-amber-600">
                Please create a {transaction.type} category first
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add {transaction.type === 'expense' ? 'Expense' : 'Income'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 