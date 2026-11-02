import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService, Transaction } from './supabase.service';
import { DEFAULT_SETTINGS } from '../models/settings';

export type { Transaction };

@Injectable({ providedIn: 'root' })
export class FinanceService {
  transactions = signal<Transaction[]>([]);
  maintenanceFee = signal(DEFAULT_SETTINGS.maintenance_fee);

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

  setMaintenanceFee(fee: number) {
    this.maintenanceFee.set(fee);
  }

  async loadTransactions() {
    const data = await this.supabase.getTransactions();
    this.transactions.set(data);
  }

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    const created = await this.supabase.addTransaction(transaction);
    this.transactions.update(prev => [created, ...prev]);
    await this.syncApartment(transaction.apt_number);
    return created;
  }

  async updateTransaction(id: string, patch: Partial<Transaction>) {
    const previous = this.transactions().find(transaction => transaction.id === id);
    const updated = await this.supabase.updateTransaction(id, patch);
    this.transactions.update(prev => prev.map(t => (t.id === id ? updated : t)));
    await this.syncApartment(previous?.apt_number);
    if (updated.apt_number !== previous?.apt_number) await this.syncApartment(updated.apt_number);
  }

  async deleteTransaction(id: string) {
    const transaction = this.transactions().find(item => item.id === id);
    await this.supabase.deleteTransaction(id);
    this.transactions.update(prev => prev.filter(t => t.id !== id));
    await this.syncApartment(transaction?.apt_number);
  }

  private async syncApartment(aptNumber: string | null | undefined) {
    if (aptNumber) await this.supabase.syncApartmentPaymentStatus(aptNumber, this.maintenanceFee());
  }
}