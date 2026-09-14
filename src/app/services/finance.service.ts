import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService, Transaction } from './supabase.service';

export type { Transaction };

@Injectable({ providedIn: 'root' })
export class FinanceService {
  transactions = signal<Transaction[]>([]);

  // Computed signals for instant updates
  totalIncome = computed(() =>
    this.transactions()
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  );

  totalExpenses = computed(() =>
    this.transactions()
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  );

  // Money remaining in the building physical box
  buildingBoxBalance = computed(() => this.totalIncome() - this.totalExpenses());

  constructor(private supabase: SupabaseService) { }

  async loadTransactions() {
    const data = await this.supabase.getTransactions();
    this.transactions.set(data);
  }

  async addTransaction(transaction: Transaction) {
    const created = await this.supabase.addTransaction(transaction);
    this.transactions.update(prev => [created, ...prev]);
  }

  async updateTransaction(id: string, patch: Partial<Transaction>) {
    const updated = await this.supabase.updateTransaction(id, patch);
    this.transactions.update(prev => prev.map(t => (t.id === id ? updated : t)));
  }

  async deleteTransaction(id: string) {
    await this.supabase.deleteTransaction(id);
    this.transactions.update(prev => prev.filter(t => t.id !== id));
  }
}