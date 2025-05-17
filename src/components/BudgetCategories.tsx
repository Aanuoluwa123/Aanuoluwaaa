import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  budget_limit?: number;
  user_id: string;
}

interface BudgetCategoriesProps {
  userId: string;
  onCategorySelect?: (category: Category | null) => void;
}

// Sample data for development mode
const sampleCategories: Category[] = [
  { id: '1', name: 'Salary', type: 'income', user_id: 'dev-user-id' },
  { id: '4', name: 'Side Hustle', type: 'income', user_id: 'dev-user-id' },
  { id: '2', name: 'Housing', type: 'expense', budget_limit: 1500, user_id: 'dev-user-id' },
  { id: '3', name: 'Food', type: 'expense', budget_limit: 400, user_id: 'dev-user-id' },
  { id: '5', name: 'Utilities', type: 'expense', budget_limit: 200, user_id: 'dev-user-id' }
];

export default function BudgetCategories({ userId, onCategorySelect }: BudgetCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryLimit, setNewCategoryLimit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    const isDevEnvironment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1';
    setIsDevelopment(isDevEnvironment);

    if (userId) {
      if (isDevEnvironment && userId === 'dev-user-id') {
        // Use sample data in development mode
        setCategories(sampleCategories);
      } else {
        fetchCategories();
      }
    }
  }, [userId]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast.error('Error loading categories: ' + error.message);
      
      // Use sample data as fallback in development mode
      if (isDevelopment) {
        setCategories(sampleCategories);
      }
    } finally {
      setLoading(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      if (isDevelopment && userId === 'dev-user-id') {
        // Simulate adding a category in development mode
        const newCategory: Category = {
          id: `dev-${Date.now()}`,
          name: newCategoryName.trim(),
          type: newCategoryType,
          budget_limit: newCategoryType === 'expense' && newCategoryLimit ? Number(newCategoryLimit) : undefined,
          user_id: userId
        };
        
        setCategories([...categories, newCategory]);
        setNewCategoryName('');
        setNewCategoryLimit('');
        toast.success('Category added successfully');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategoryName.trim(),
            type: newCategoryType,
            budget_limit: newCategoryType === 'expense' && newCategoryLimit ? Number(newCategoryLimit) : null,
            user_id: userId
          }
        ])
        .select();

      if (error) throw error;
      
      if (data) {
        setCategories([...categories, ...data]);
        setNewCategoryName('');
        setNewCategoryLimit('');
        toast.success('Category added successfully');
      }
    } catch (error: any) {
      toast.error('Error adding category: ' + error.message);
    }
  }

  async function deleteCategory(id: string) {
    try {
      if (isDevelopment && userId === 'dev-user-id') {
        // Simulate deleting a category in development mode
        setCategories(categories.filter(c => c.id !== id));
        toast.success('Category deleted');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted');
    } catch (error: any) {
      toast.error('Error deleting category: ' + error.message);
    }
  }

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Budget Categories</h2>
      
      {isDevelopment && userId === 'dev-user-id' && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p className="font-medium">Development Mode</p>
          <p>Changes will not be saved to a database</p>
        </div>
      )}
      
      <form onSubmit={addCategory} className="mb-6">
        <div className="flex flex-col md:flex-row gap-2 mb-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            required
            className="flex-grow p-2 border rounded"
          />
          
          <select
            value={newCategoryType}
            onChange={(e) => setNewCategoryType(e.target.value as 'income' | 'expense')}
            className="p-2 border rounded"
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        
        {newCategoryType === 'expense' && (
          <div className="mb-2">
            <input
              type="number"
              value={newCategoryLimit}
              onChange={(e) => setNewCategoryLimit(e.target.value)}
              placeholder="Monthly budget limit (optional)"
              className="w-full p-2 border rounded"
              min="0"
              step="0.01"
            />
          </div>
        )}
        
        <button 
          type="submit" 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
        >
          Add Category
        </button>
      </form>
      
      <div>
        <h3 className="font-bold mb-2">Income Categories</h3>
        <ul className="mb-4">
          {categories
            .filter(c => c.type === 'income')
            .map(category => (
              <li 
                key={category.id} 
                className="p-2 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => onCategorySelect && onCategorySelect(category)}
              >
                <span>{category.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCategory(category.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          {categories.filter(c => c.type === 'income').length === 0 && (
            <li className="text-gray-500 italic">No income categories yet</li>
          )}
        </ul>
        
        <h3 className="font-bold mb-2">Expense Categories</h3>
        <ul>
          {categories
            .filter(c => c.type === 'expense')
            .map(category => (
              <li 
                key={category.id} 
                className="p-2 border-b flex justify-between items-center cursor-pointer hover:bg-gray-50"
                onClick={() => onCategorySelect && onCategorySelect(category)}
              >
                <div>
                  <span>{category.name}</span>
                  {category.budget_limit && (
                    <span className="ml-2 text-sm text-gray-500">
                      (Limit: ${category.budget_limit})
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCategory(category.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
          {categories.filter(c => c.type === 'expense').length === 0 && (
            <li className="text-gray-500 italic">No expense categories yet</li>
          )}
        </ul>
      </div>
    </div>
  );
} 