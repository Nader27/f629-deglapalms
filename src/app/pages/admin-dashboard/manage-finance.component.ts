import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FinanceService, Transaction } from '../../services/finance.service';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-manage-finance',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="min-h-screen bg-slate-100 p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 class="text-2xl font-bold text-slate-800">Building Box — Finance</h1>
        <nav class="flex gap-3">
          <a routerLink="/admin/residents" class="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700">← Residents</a>
          <a routerLink="/" class="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm hover:bg-slate-50">View Public Page</a>
        </nav>
      </header>

      <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Total Collected</p>
          <p class="text-2xl font-bold text-emerald-600">{{ finance.totalIncome() }} LE</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Total Expenses</p>
          <p class="text-2xl font-bold text-red-500">{{ finance.totalExpenses() }} LE</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Remaining in Box</p>
          <p class="text-2xl font-bold text-slate-800">{{ finance.buildingBoxBalance() }} LE</p>
        </div>
      </section>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-4">Log Income / Expense</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Title</label>
            <input [(ngModel)]="form.title" class="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. Elevator maintenance" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Amount (LE)</label>
            <input type="number" [(ngModel)]="form.amount" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Type</label>
            <select [(ngModel)]="form.type" class="w-full rounded-lg border border-slate-300 px-3 py-2">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Related Apartment (optional)</label>
            <input [(ngModel)]="form.apt_number" class="w-full rounded-lg border border-slate-300 px-3 py-2" placeholder="e.g. 305" />
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs text-slate-500 mb-1">
              {{ form.type === 'income' ? 'Payment Screenshot (optional)' : 'Receipt Image (optional)' }}
            </label>
            <input type="file" accept="image/*" (change)="onFileSelected($event)" class="w-full text-sm" />
          </div>
        </div>

        @if (errorMessage()) {
          <p class="text-red-500 text-sm mt-3">{{ errorMessage() }}</p>
        }

        <button (click)="submit()" [disabled]="saving()"
          class="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50">
          {{ saving() ? 'Saving…' : 'Add Transaction' }}
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th class="text-left px-4 py-3">Date</th>
              <th class="text-left px-4 py-3">Title</th>
              <th class="text-left px-4 py-3">Apt #</th>
              <th class="text-left px-4 py-3">Type</th>
              <th class="text-left px-4 py-3">Amount</th>
              <th class="text-left px-4 py-3">Image</th>
            </tr>
          </thead>
          <tbody>
            @for (t of finance.transactions(); track t.id) {
              <tr class="border-t border-slate-100">
                <td class="px-4 py-2 text-slate-500">{{ t.created_at | date: 'short' }}</td>
                <td class="px-4 py-2">{{ t.title }}</td>
                <td class="px-4 py-2">{{ t.apt_number || '—' }}</td>
                <td class="px-4 py-2">
                  <span [class.text-emerald-600]="t.type === 'income'" [class.text-red-500]="t.type === 'expense'">
                    {{ t.type }}
                  </span>
                </td>
                <td class="px-4 py-2 font-medium">{{ t.amount }} LE</td>
                <td class="px-4 py-2">
                  @if (t.receipt_url) {
                    <a [href]="t.receipt_url" target="_blank">
                      <img [src]="t.receipt_url" alt="" class="w-10 h-10 object-cover rounded border border-slate-200" />
                    </a>
                  } @else {
                    —
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class ManageFinanceComponent implements OnInit {
    saving = signal(false);
    errorMessage = signal('');
    selectedFile: File | null = null;

    form: { title: string; amount: number | null; type: 'income' | 'expense'; apt_number: string } = {
        title: '',
        amount: null,
        type: 'income',
        apt_number: '',
    };

    constructor(public finance: FinanceService, private supabase: SupabaseService) { }

    async ngOnInit() {
        await this.finance.loadTransactions();
    }

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        this.selectedFile = input.files?.[0] ?? null;
    }

    async submit() {
        if (!this.form.title || !this.form.amount) {
            this.errorMessage.set('Title and amount are required.');
            return;
        }
        this.saving.set(true);
        this.errorMessage.set('');

        try {
            let receiptUrl: string | null = null;
            if (this.selectedFile) {
                receiptUrl = await this.supabase.uploadReceipt(this.selectedFile);
            }

            const transaction: Transaction = {
                title: this.form.title,
                amount: this.form.amount,
                type: this.form.type,
                apt_number: this.form.apt_number || null,
                receipt_url: receiptUrl,
            };

            await this.finance.addTransaction(transaction);
            this.form = { title: '', amount: null, type: 'income', apt_number: '' };
            this.selectedFile = null;
        } catch {
            this.errorMessage.set('Failed to save transaction. Please try again.');
        } finally {
            this.saving.set(false);
        }
    }
}
