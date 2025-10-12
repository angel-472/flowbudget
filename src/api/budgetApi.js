console.log('🧳 Budget Data API initialized');

// Polyfill to generate a UUID (if crypto.randomUUID is not available)
if (!crypto.randomUUID) {
  // @ts-ignore
  crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

class BudgetApi {
  constructor(){
    this.transactions = [];
  }
  getAllTransactions() {
    return this.transactions;
  }
  addTransaction(id, type, category, description, amount, date, status) {
    let userId = "";
    let newTransaction = {
      id: id || crypto.randomUUID(),
      user_id: userId,
      type: type,
      category: category,
      description: description,
      amount: parseFloat(amount),
      date: date,
      status: status || 'pending'
    };
    this.transactions.push(newTransaction);
  }
  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }
  toggleTransactionStatus(id) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.status = transaction.status === 'done' ? 'pending' : 'done';
    }
  }
}

export const budgetApi = new BudgetApi();

if (import.meta.env.DEV) {
 window.budgetApi = budgetApi; // Expose for debugging in dev mode
}