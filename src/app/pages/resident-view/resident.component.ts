import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FinanceService } from '../../services/finance.service';
import { TranslationService } from '../../services/translation.service';
import { BuildingPlanComponent } from '../../components/building-plan.component';
import { FloorTabsComponent } from '../../components/floor-tabs.component';
import {
    Apartment,
    FLOORS,
    FloorName,
    MAINTENANCE_FEE,
    generateBuildingLayout,
} from '../../models/building';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings';

@Component({
    selector: 'app-resident-view',
    standalone: true,
    imports: [RouterLink, DatePipe, BuildingPlanComponent, FloorTabsComponent],
    template: `
    <div class="min-h-screen bg-slate-900 text-white p-6" [attr.dir]="t.dir()">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold">{{ t.t('appTitle') }}</h1>
          <p class="text-slate-400 text-sm">{{ t.t('maintenanceFee', { fee }) }}</p>
        </div>
        <div class="flex gap-2">
          <button (click)="t.toggle()" class="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm">
            {{ t.t('languageButton') }}
          </button>
          @if (settings().whatsapp_url) {
            <a [href]="settings().whatsapp_url" target="_blank" rel="noopener"
              class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm">{{ t.t('whatsappGroup') }}</a>
          }
          <a routerLink="/admin/login" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm">{{ t.t('managerLogin') }}</a>
        </div>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <button type="button" (click)="showTransactions.set(true)"
          class="text-left bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-indigo-500 transition">
          <p class="text-slate-400 text-xs uppercase">{{ t.t('buildingBoxBalance') }}</p>
          <p class="text-2xl font-bold">{{ finance.buildingBoxBalance() }} LE</p>
          <p class="text-indigo-400 text-xs mt-1">{{ t.t('viewTransactions') }} →</p>
        </button>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p class="text-slate-400 text-xs uppercase">{{ t.t('paymentProgress') }}</p>
          <p class="text-2xl font-bold">{{ t.t('paidOf', { paid: progress().paid, total: progress().total }) }}</p>
          <div class="h-2 mt-2 rounded-full bg-slate-700 overflow-hidden">
            <div class="h-full bg-emerald-500" [style.width.%]="progress().percent"></div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 flex flex-wrap items-center gap-3 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-sky-700 inline-block"></span> {{ t.t('ownerOccupied') }}</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-violet-700 inline-block"></span> {{ t.t('rented') }}</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-slate-700 inline-block"></span> {{ t.t('noInfo') }}</span>
          <span class="flex items-center gap-1">✓ {{ t.t('paid') }}</span>
        </div>
      </section>

      @if (loading()) {
        <p class="text-slate-400">{{ t.t('loadingLayout') }}</p>
      } @else {
        <div class="flex gap-3 items-start">
          <app-floor-tabs [floors]="floors" [selected]="selectedFloor()" (floorChange)="selectedFloor.set($event)" />
          <div class="flex-1 min-w-0">
            <app-building-plan [apartments]="apartments()" [floor]="selectedFloor()" [transactions]="finance.transactions()" [paymentUrl]="settings().payment_url" [showPersonalInfo]="false" [editable]="false" />
          </div>
        </div>
      }

      @if (showTransactions()) {
        <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" (click)="showTransactions.set(false)">
          <div class="bg-slate-800 border border-slate-700 rounded-xl p-5 w-full max-w-2xl max-h-[85vh] overflow-y-auto relative" (click)="$event.stopPropagation()">
            <button type="button" (click)="showTransactions.set(false)" aria-label="Close"
              class="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center">✕</button>
            <h2 class="text-lg font-bold pr-8">{{ t.t('transactionsTitle') }}</h2>
            <p class="text-slate-400 text-sm mb-4">{{ t.t('transactionsSubtitle') }}</p>

            @if (!finance.transactions().length) {
              <p class="text-slate-500 text-sm">{{ t.t('noTransactionsYet') }}</p>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="text-slate-400 uppercase text-xs">
                    <tr>
                      <th class="text-start px-3 py-2">{{ t.t('date') }}</th>
                      <th class="text-start px-3 py-2">{{ t.t('title') }}</th>
                      <th class="text-start px-3 py-2">{{ t.t('apartment') }}</th>
                      <th class="text-start px-3 py-2">{{ t.t('type') }}</th>
                      <th class="text-start px-3 py-2">{{ t.t('amount') }}</th>
                      <th class="text-start px-3 py-2">{{ t.t('image') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (tr of finance.transactions(); track tr.id) {
                      <tr class="border-t border-slate-700">
                        <td class="px-3 py-2 text-slate-400">{{ tr.created_at | date: 'short' }}</td>
                        <td class="px-3 py-2">{{ tr.title }}</td>
                        <td class="px-3 py-2">{{ tr.apt_number || '—' }}</td>
                        <td class="px-3 py-2">
                          <span [class.text-emerald-400]="tr.type === 'income'" [class.text-red-400]="tr.type === 'expense'">
                            {{ tr.type === 'income' ? t.t('income') : t.t('expense') }}
                          </span>
                        </td>
                        <td class="px-3 py-2 font-medium">{{ tr.amount }} LE</td>
                        <td class="px-3 py-2">
                          @if (tr.receipt_url) {
                            <a [href]="tr.receipt_url" target="_blank" rel="noopener">
                              <img [src]="tr.receipt_url" alt="" class="w-12 h-12 object-cover rounded-lg border border-slate-600" />
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
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class ResidentComponent implements OnInit {
    readonly fee = MAINTENANCE_FEE;
    readonly floors = FLOORS;

    loading = signal(true);
    selectedFloor = signal<FloorName>('Ground');
    apartments = signal<Apartment[]>([]);
    settings = signal<AppSettings>(DEFAULT_SETTINGS);
    showTransactions = signal(false);

    progress = computed(() => {
        const list = this.apartments();
        const paid = list.filter(a => a.has_paid).length;
        const total = list.length;
        return { paid, total, percent: total ? Math.round((paid / total) * 100) : 0 };
    });

    constructor(private supabase: SupabaseService, public finance: FinanceService, public t: TranslationService) { }

    async ngOnInit() {
        await Promise.all([this.load(), this.finance.loadTransactions(), this.loadSettings()]);
    }

    async loadSettings() {
        try {
            this.settings.set(await this.supabase.getSettings());
        } catch {
            this.settings.set(DEFAULT_SETTINGS);
        }
    }

    async load() {
        this.loading.set(true);
        const layout = generateBuildingLayout();
        let saved: Apartment[] = [];
        try {
            saved = await this.supabase.getApartments();
        } catch {
            saved = [];
        }
        const savedByNumber = new Map(saved.map(a => [a.apt_number, a]));
        const merged = layout.map(slot => savedByNumber.get(slot.apt_number) ?? slot);
        this.apartments.set(merged);
        this.loading.set(false);
    }
}

