import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Transaction {
  id?: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  apt_number?: string;
  receipt_url?: string;
  created_at?: string;
}

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

  constructor(private supabase: SupabaseService) {}

  async loadTransactions() {
    const { data } = await this.supabase.client
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) this.transactions.set(data);
  }

  async addTransaction(transaction: Transaction) {
    const { data, error } = await this.supabase.client
      .from('transactions')
      .insert([transaction])
      .select();

    if (!error && data) {
      this.transactions.update(prev => [data[0], ...prev]);
    }
  }
}