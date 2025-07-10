import React, { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { Category, Transaction } from '../lib/localStorage';
import { eventBus, EVENTS } from '../lib/eventBus';
import { toast } from 'react-hot-toast';

interface TransactionFormProps {
  userId: string;
  transactionToEdit?: Transaction;
  onTransactionAdded?: () => void;
  onTransactionUpdated?: () => void;
  onCancel?: () => void;
}

export default function TransactionForm({ 
  userId, 
  transactionToEdit, 
  onTransactionAdded, 
  onTransactionUpdated,
  onCancel 
}: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState<Partial<Transaction>>(
    transactionToEdit || {
      description: '',
      amount: 0,
      type: 'expense',
      category_id: '',
      currency: 'USD', // Default to USD
      created_at: new Date().toISOString() // Default to current date/time
    }
  );

  // Update form when transactionToEdit changes
  useEffect(() => {
    if (transactionToEdit) {
      setTransaction(transactionToEdit);
    } else {
      setTransaction({
        description: '',
        amount: 0,
        type: 'expense',
        category_id: '',
        currency: 'USD',
        created_at: new Date().toISOString()
      });
    }
  }, [transactionToEdit]);

  // Supported currencies
  const supportedCurrencies = [
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
    { value: 'GBP', label: 'British Pound (GBP)' },
    { value: 'NGN', label: 'Naira (NGN)' },
    { value: 'AUD', label: 'Australian Dollar (AUD)' }
  ];

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

  // Format date for input[type="date"]
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Handle date change
  const handleDateChange = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    setTransaction(prev => ({
      ...prev,
      created_at: date.toISOString()
    }));
  };

  // Set default time to current time if not set
  useEffect(() => {
    if (!transaction.created_at) {
      setTransaction(prev => ({
        ...prev,
        created_at: new Date().toISOString()
      }));
    }
  }, []);

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
    
    if (!transaction.created_at) {
      toast.error('Please select a valid date');
      return;
    }
    
    setLoading(true);
    
    try {
      const isEdit = !!transaction.id;
      const transactionToSave: Transaction = {
        ...transaction as Transaction,
        id: transaction.id || '',
        user_id: userId,
        created_at: transaction.created_at || new Date().toISOString()
      };
      
      await dataService.saveTransaction(transactionToSave);
      
      if (isEdit) {
        toast.success('Transaction updated successfully');
        if (onTransactionUpdated) onTransactionUpdated();
      } else {
        toast.success('Transaction added successfully');
        // Reset form only for new transactions
        setTransaction({
          description: '',
          amount: 0,
          type: 'expense',
          category_id: '',
          currency: 'USD',
          created_at: new Date().toISOString()
        });
        if (onTransactionAdded) onTransactionAdded();
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={transaction.created_at ? formatDateForInput(transaction.created_at) : ''}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Amount
          </label>
          <div className="flex items-center gap-2">
            <select
              name="currency"
              value={transaction.currency}
              onChange={handleInputChange}
              className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              {supportedCurrencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">{transaction.currency}</span>
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
                placeholder=""
                required
              />
            </div>
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
                {transaction.id ? 'Updating...' : 'Processing...'}
              </div>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  {transaction.id ? (
                    <path fillRule="evenodd" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  )}
                </svg>
                {transaction.id ? 'Update' : `Add ${transaction.type === 'expense' ? 'Expense' : 'Income'}`}
              </>
            )}
          </button>
        </div>
        
        {onCancel && (
          <div className="pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        )}
      </form>
    </div>
  );
} 