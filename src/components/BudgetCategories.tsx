import React, { useState, useEffect } from 'react';
import { dataService } from '../lib/dataService';
import { Category } from '../lib/localStorage';
import { eventBus, EVENTS } from '../lib/eventBus';
import { toast } from 'react-hot-toast';

interface BudgetCategoriesProps {
  userId: string;
}

export default function BudgetCategories({ userId }: BudgetCategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    type: 'expense',
    budget_limit: 0,
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();

    // Subscribe to category events
    const createUnsubscribe = eventBus.on(EVENTS.CATEGORY_CREATED, handleCategoryCreated);
    const updateUnsubscribe = eventBus.on(EVENTS.CATEGORY_UPDATED, handleCategoryUpdated);
    const deleteUnsubscribe = eventBus.on(EVENTS.CATEGORY_DELETED, handleCategoryDeleted);
    
    return () => {
      createUnsubscribe();
      updateUnsubscribe();
      deleteUnsubscribe();
    };
  }, [userId]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await dataService.getCategories(userId);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryCreated = (category: Category) => {
    setCategories(prev => [category, ...prev]);
  };

  const handleCategoryUpdated = (updatedCategory: Category) => {
    setCategories(prev => 
      prev.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat)
    );
  };

  const handleCategoryDeleted = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (editingCategory) {
      setEditingCategory({
        ...editingCategory,
        [name]: name === 'budget_limit' ? parseFloat(value) || 0 : value
      });
    } else {
      setNewCategory({
        ...newCategory,
        [name]: name === 'budget_limit' ? parseFloat(value) || 0 : value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        await dataService.saveCategory(editingCategory);
        toast.success('Category updated successfully');
        setEditingCategory(null);
      } else {
        // Create new category
        if (!newCategory.name) {
          toast.error('Category name is required');
          return;
        }
        
        const categoryToSave: Category = {
          ...newCategory as Category,
          id: '',
          user_id: userId,
          created_at: new Date().toISOString()
        };
        
        await dataService.saveCategory(categoryToSave);
        toast.success('Category created successfully');
        
        // Reset form
        setNewCategory({
          name: '',
          type: 'expense',
          budget_limit: 0,
        });
      }
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({
      name: '',
      type: 'expense',
      budget_limit: 0,
    });
  };

  const handleDelete = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await dataService.deleteCategory(categoryId);
        toast.success('Category deleted successfully');
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingCategory(null);
  };

  // Filter categories by type
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editingCategory ? editingCategory.name : newCategory.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Groceries, Salary"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Category Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={editingCategory ? editingCategory.type : newCategory.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="budget_limit" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Limit {editingCategory?.type === 'income' || newCategory.type === 'income' ? '(Optional)' : ''}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    id="budget_limit"
                    name="budget_limit"
                    value={editingCategory ? editingCategory.budget_limit || 0 : newCategory.budget_limit || 0}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-7 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Expense Categories */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Expense Categories</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : expenseCategories.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No expense categories found. Create one above.
              </div>
            ) : (
              <div className="space-y-4">
                {expenseCategories.map(category => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                        <div className="mt-1 text-sm text-gray-500">
                          Budget: ${category.budget_limit?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-100 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {category.budget_limit && category.budget_limit > 0 && (
                      <div className="mt-3">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 text-right">
                          $0.00 / ${category.budget_limit.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Income Categories */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-500 px-6 py-4">
            <h3 className="text-lg font-medium text-white">Income Categories</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-4">
                <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : incomeCategories.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No income categories found. Create one above.
              </div>
            ) : (
              <div className="space-y-4">
                {incomeCategories.map(category => (
                  <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{category.name}</h4>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="p-1.5 rounded-md text-gray-600 hover:bg-gray-200 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="p-1.5 rounded-md text-red-600 hover:bg-red-100 focus:outline-none"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 