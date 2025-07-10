import { supabase, isUsingRealSupabase } from './supabaseClient';
import { localStorageService, Category, Transaction } from './localStorage';
import { eventBus, EVENTS } from './eventBus';
import { toast } from 'react-hot-toast';

/**
 * Data service that handles both Supabase and localStorage
 * depending on the environment
 */
class DataService {
    private isUsingSupabase: boolean;

    constructor() {
        this.isUsingSupabase = isUsingRealSupabase();
    }

    // Categories
    async getCategories(userId: string): Promise<Category[]> {
        try {
            if (this.isUsingSupabase) {
                const { data, error } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Category[];
            } else {
                return localStorageService.getCategories(userId);
            }
        } catch (error: any) {
            console.error('Error fetching categories:', error.message);
            toast.error(`Failed to fetch categories: ${error.message}`);
            return [];
        }
    }

    async saveCategory(category: Category): Promise<Category | null> {
        try {
            if (this.isUsingSupabase) {
                // If it has an ID, update it, otherwise insert it
                let result;
                if (category.id) {
                    result = await supabase
                        .from('categories')
                        .update(category)
                        .eq('id', category.id)
                        .select()
                        .single();
                } else {
                    result = await supabase
                        .from('categories')
                        .insert(category)
                        .select()
                        .single();
                }

                if (result.error) throw result.error;

                // Emit event for other components
                eventBus.emit(
                    category.id ? EVENTS.CATEGORY_UPDATED : EVENTS.CATEGORY_CREATED,
                    result.data
                );

                return result.data as Category;
            } else {
                const savedCategory = localStorageService.saveCategory(category);

                // Emit event for other components
                eventBus.emit(
                    category.id ? EVENTS.CATEGORY_UPDATED : EVENTS.CATEGORY_CREATED,
                    savedCategory
                );

                return savedCategory;
            }
        } catch (error: any) {
            console.error('Error saving category:', error.message);
            toast.error(`Failed to save category: ${error.message}`);
            return null;
        }
    }

    async deleteCategory(categoryId: string): Promise<boolean> {
        try {
            if (this.isUsingSupabase) {
                const { error } = await supabase
                    .from('categories')
                    .delete()
                    .eq('id', categoryId);

                if (error) throw error;
            } else {
                localStorageService.deleteCategory(categoryId);
            }

            // Emit event for other components
            eventBus.emit(EVENTS.CATEGORY_DELETED, categoryId);

            return true;
        } catch (error: any) {
            console.error('Error deleting category:', error.message);
            toast.error(`Failed to delete category: ${error.message}`);
            return false;
        }
    }

    // Transactions
    async getTransactions(userId: string): Promise<Transaction[]> {
        try {
            if (this.isUsingSupabase) {
                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                return data as Transaction[];
            } else {
                return localStorageService.getTransactions(userId);
            }
        } catch (error: any) {
            console.error('Error fetching transactions:', error.message);
            toast.error(`Failed to fetch transactions: ${error.message}`);
            return [];
        }
    }

    async saveTransaction(transaction: Transaction): Promise<Transaction | null> {
        try {
            if (this.isUsingSupabase) {
                // If it has an ID, update it, otherwise insert it
                let result;
                if (transaction.id) {
                    result = await supabase
                        .from('transactions')
                        .update(transaction)
                        .eq('id', transaction.id)
                        .select()
                        .single();
                } else {
                    result = await supabase
                        .from('transactions')
                        .insert(transaction)
                        .select()
                        .single();
                }

                if (result.error) throw result.error;

                // Emit event for other components
                const eventName = transaction.id ? EVENTS.TRANSACTION_UPDATED : EVENTS.TRANSACTION_CREATED;
                eventBus.emit(eventName, result.data);

                return result.data as Transaction;
            } else {
                const savedTransaction = localStorageService.saveTransaction(transaction);

                // Emit event for other components
                const eventName = transaction.id ? EVENTS.TRANSACTION_UPDATED : EVENTS.TRANSACTION_CREATED;
                eventBus.emit(eventName, savedTransaction);

                return savedTransaction;
            }
        } catch (error: any) {
            console.error('Error saving transaction:', error.message);
            toast.error(`Failed to save transaction: ${error.message}`);
            return null;
        }
    }

    async deleteTransaction(transactionId: string): Promise<boolean> {
        try {
            if (this.isUsingSupabase) {
                const { error } = await supabase
                    .from('transactions')
                    .delete()
                    .eq('id', transactionId);

                if (error) throw error;
            } else {
                localStorageService.deleteTransaction(transactionId);
            }

            // Emit event for other components
            eventBus.emit(EVENTS.TRANSACTION_DELETED, transactionId);

            return true;
        } catch (error: any) {
            console.error('Error deleting transaction:', error.message);
            toast.error(`Failed to delete transaction: ${error.message}`);
            return false;
        }
    }

    // Dashboard data
    async getDashboardData(userId: string) {
        try {
            if (this.isUsingSupabase) {
                // In a real app, we might have a dedicated API endpoint for this
                // For now, we'll fetch transactions and categories separately
                const transactions = await this.getTransactions(userId);
                const categories = await this.getCategories(userId);

                // Aggregate totals by currency
                const currencyTotals: Record<string, { income: number; expenses: number }> = {};
                transactions.forEach(t => {
                    if (!currencyTotals[t.currency]) {
                        currencyTotals[t.currency] = { income: 0, expenses: 0 };
                    }
                    if (t.type === 'income') {
                        currencyTotals[t.currency].income += t.amount;
                    } else {
                        currencyTotals[t.currency].expenses += t.amount;
                    }
                });

                // Calculate total balance by currency
                const balancesByCurrency = Object.entries(currencyTotals).reduce((acc, [currency, totals]) => {
                    acc[currency] = totals.income - totals.expenses;
                    return acc;
                }, {} as Record<string, number>);

                // Get category spending - include both income and expense categories
                const categorySpending = categories.map(category => {
                    const categoryTransactions = transactions.filter(t => t.category_id === category.id);
                    const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
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
                    currencyTotals,
                    balance: Object.values(balancesByCurrency).reduce((sum, balance) => sum + balance, 0),
                    categorySpending,
                    recentTransactions: transactions.slice(0, 5)
                };
            } else {
                return localStorageService.getDashboardData(userId);
            }
        } catch (error: any) {
            console.error('Error fetching dashboard data:', error.message);
            toast.error(`Failed to fetch dashboard data: ${error.message}`);
            return {
                currencyTotals: {},
                balance: 0,
                categorySpending: [],
                recentTransactions: []
            };
        }
    }
}

export const dataService = new DataService();