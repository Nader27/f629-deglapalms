import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { FinanceService } from '../../services/finance.service';
import {
    Apartment,
    BLOCKS_TOP_TO_BOTTOM,
    FLOORS,
    FloorName,
    MAINTENANCE_FEE,
    generateBuildingLayout,
} from '../../models/building';

@Component({
    selector: 'app-resident-view',
    standalone: true,
    imports: [RouterLink],
    template: `
    <div class="min-h-screen bg-slate-900 text-white p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold">🏢 Building Maintenance Tracker</h1>
          <p class="text-slate-400 text-sm">Maintenance fee: {{ fee }} LE per apartment</p>
        </div>
        <a routerLink="/admin/login" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm">Manager Login</a>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p class="text-slate-400 text-xs uppercase">Building Box Balance</p>
          <p class="text-2xl font-bold">{{ finance.buildingBoxBalance() }} LE</p>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <p class="text-slate-400 text-xs uppercase">Payment Progress</p>
          <p class="text-2xl font-bold">{{ progress().paid }} / {{ progress().total }} paid</p>
          <div class="h-2 mt-2 rounded-full bg-slate-700 overflow-hidden">
            <div class="h-full bg-emerald-500" [style.width.%]="progress().percent"></div>
          </div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center gap-4 text-xs">
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Paid</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-red-500 inline-block"></span> Unpaid</span>
          <span class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-slate-600 inline-block"></span> Gate</span>
        </div>
      </section>

      <div class="flex gap-2 mb-6 overflow-x-auto">
        @for (floor of floors; track floor) {
          <button (click)="selectedFloor.set(floor)"
            class="px-4 py-2 rounded-lg text-sm whitespace-nowrap"
            [class.bg-indigo-600]="selectedFloor() === floor"
            [class.bg-slate-800]="selectedFloor() !== floor">
            {{ floor }}
          </button>
        }
      </div>

      @if (loading()) {
        <p class="text-slate-400">Loading building layout…</p>
      } @else {
        <div class="space-y-3">
          @for (block of blocks; track block) {
            <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <p class="text-xs text-slate-400 uppercase mb-2">{{ block }} Block</p>
              <div class="flex flex-wrap gap-2">
                @for (apt of aptsFor(block); track apt.apt_number) {
                  <div
                    class="min-w-[72px] text-center rounded-lg px-3 py-2 text-sm font-semibold"
                    [class.bg-slate-600]="apt.is_gate"
                    [class.bg-emerald-600]="!apt.is_gate && apt.has_paid"
                    [class.bg-red-600]="!apt.is_gate && !apt.has_paid">
                    {{ apt.is_gate ? 'GATE' : apt.apt_number }}
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ResidentComponent implements OnInit {
    readonly fee = MAINTENANCE_FEE;
    readonly floors = FLOORS;
    readonly blocks = BLOCKS_TOP_TO_BOTTOM;

    loading = signal(true);
    selectedFloor = signal<FloorName>('Ground');
    apartments = signal<Apartment[]>([]);

    progress = computed(() => {
        const list = this.apartments().filter(a => !a.is_gate);
        const paid = list.filter(a => a.has_paid).length;
        const total = list.length;
        return { paid, total, percent: total ? Math.round((paid / total) * 100) : 0 };
    });

    constructor(private supabase: SupabaseService, public finance: FinanceService) { }

    async ngOnInit() {
        await Promise.all([this.load(), this.finance.loadTransactions()]);
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

    aptsFor(block: (typeof this.blocks)[number]): Apartment[] {
        return this.apartments()
            .filter(a => a.floor === this.selectedFloor() && a.block === block)
            .sort((a, b) => a.apt_number.localeCompare(b.apt_number));
    }
}
