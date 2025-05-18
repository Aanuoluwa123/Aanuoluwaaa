// Keys for local storage
const CATEGORIES_KEY = 'bolt_finance_categories';
const TRANSACTIONS_KEY = 'bolt_finance_transactions';

// Types
export interface Category {
    id: string;
    name: string;
    type: 'income' | 'expense';
    budget_limit?: number;
    user_id: string;
    created_at: string;
}

export interface Transaction {
    id: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
    created_at: string;
    user_id: string;
    category_id?: string;
}

/**
 * Local storage service for development mode
 * Simulates a database when Supabase is not available
 */
class LocalStorageService {
    // Categories
    getCategories(userId: string): Category[] {
        try {
            const categoriesJson = localStorage.getItem(CATEGORIES_KEY);
            if (!categoriesJson) return [];

            const allCategories = JSON.parse(categoriesJson) as Category[];
            return allCategories.filter(cat => cat.user_id === userId);
        } catch (error) {
            console.error('Error getting categories from localStorage:', error);
            return [];
        }
    }

    saveCategory(category: Category): Category {
        try {
            // Get existing categories
            const categoriesJson = localStorage.getItem(CATEGORIES_KEY);
            const categories = categoriesJson ? JSON.parse(categoriesJson) as Category[] : [];

            // If category has no ID, generate one
            if (!category.id) {
                category.id = this.generateId();
                category.created_at = new Date().toISOString();
                categories.push(category);
            } else {
                // Update existing category
                const index = categories.findIndex(c => c.id === category.id);
                if (index >= 0) {
                    categories[index] = category;
                } else {
                    categories.push(category);
                }
            }

            // Save back to localStorage
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
            return category;
        } catch (error) {
            console.error('Error saving category to localStorage:', error);
            throw new Error('Failed to save category');
        }
    }

    deleteCategory(categoryId: string): void {
        try {
            const categoriesJson = localStorage.getItem(CATEGORIES_KEY);
            if (!categoriesJson) return;

            const categories = JSON.parse(categoriesJson) as Category[];
            const updatedCategories = categories.filter(c => c.id !== categoryId);

            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));

            // Also update transactions to remove this category
            this.removeDeletedCategoryFromTransactions(categoryId);
        } catch (error) {
            console.error('Error deleting category from localStorage:', error);
            throw new Error('Failed to delete category');
        }
    }

    // Transactions
    getTransactions(userId: string): Transaction[] {
        try {
            const transactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
            if (!transactionsJson) return [];

            const allTransactions = JSON.parse(transactionsJson) as Transaction[];
            return allTransactions
                .filter(tx => tx.user_id === userId)
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (error) {
            console.error('Error getting transactions from localStorage:', error);
            return [];
        }
    }

    saveTransaction(transaction: Transaction): Transaction {
        try {
            // Get existing transactions
            const transactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
            const transactions = transactionsJson ? JSON.parse(transactionsJson) as Transaction[] : [];

            // If transaction has no ID, generate one
            if (!transaction.id) {
                transaction.id = this.generateId();
                transaction.created_at = new Date().toISOString();
                transactions.push(transaction);
            } else {
                // Update existing transaction
                const index = transactions.findIndex(t => t.id === transaction.id);
                if (index >= 0) {
                    transactions[index] = transaction;
                } else {
                    transactions.push(transaction);
                }
            }

            // Save back to localStorage
            localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
            return transaction;
        } catch (error) {
            console.error('Error saving transaction to localStorage:', error);
            throw new Error('Failed to save transaction');
        }
    }

    deleteTransaction(transactionId: string): void {
        try {
            const transactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
            if (!transactionsJson) return;

            const transactions = JSON.parse(transactionsJson) as Transaction[];
            const updatedTransactions = transactions.filter(t => t.id !== transactionId);

            localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
        } catch (error) {
            console.error('Error deleting transaction from localStorage:', error);
            throw new Error('Failed to delete transaction');
        }
    }

    // Helper methods
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    private removeDeletedCategoryFromTransactions(categoryId: string): void {
        try {
            const transactionsJson = localStorage.getItem(TRANSACTIONS_KEY);
            if (!transactionsJson) return;

            const transactions = JSON.parse(transactionsJson) as Transaction[];
            const updatedTransactions = transactions.map(t => {
                if (t.category_id === categoryId) {
                    return { ...t, category_id: undefined };
                }
                return t;
            });

            localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(updatedTransactions));
        } catch (error) {
            console.error('Error updating transactions after category deletion:', error);
        }
    }

    // Get transactions for a specific category
    getTransactionsByCategory(userId: string, categoryId: string): Transaction[] {
        try {
            const transactions = this.getTransactions(userId);
            return transactions.filter(t => t.category_id === categoryId);
        } catch (error) {
            console.error('Error getting transactions by category:', error);
            return [];
        }
    }

    // Get summary data for dashboard
    getDashboardData(userId: string) {
        const transactions = this.getTransactions(userId);
        const categories = this.getCategories(userId);

        // Calculate totals
        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        // Get category spending - include both income and expense categories
        const categorySpending = categories.map(category => {
            const transactions = this.getTransactionsByCategory(userId, category.id);
            const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
            const budget = category.budget_limit || 0;

            return {
                id: category.id,
                name: category.name,
                spent,
                budget,
                percentage: budget > 0 ? (spent / budget) * 100 : 0,
                type: category.type
            };
        });

        return {
            totalIncome,
            totalExpenses,
            balance: totalIncome - totalExpenses,
            categorySpending,
            recentTransactions: transactions.slice(0, 5)
        };
    }
}

export const localStorageService = new LocalStorageService(); 