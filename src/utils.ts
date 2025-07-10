export function formatCurrency(amount: number, currency: string = 'USD'): string {
    // Ensure we have a valid currency code
    const safeCurrency = currency?.trim() || 'USD';
    
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCurrency,
            minimumFractionDigits: 2
        }).format(amount);
    } catch (error) {
        console.error(`Error formatting currency (${safeCurrency}):`, error);
        // Fallback to USD if there's an error with the provided currency
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    }
}

export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function getProgressBarWidth(percentage: number): string {
    if (percentage > 100) return '100%';
    return `${percentage}%`;
}
