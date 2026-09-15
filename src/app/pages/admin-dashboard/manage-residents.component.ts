import { Component, OnInit, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { FinanceService } from '../../services/finance.service';
import { BuildingPlanComponent } from '../../components/building-plan.component';
import { FloorTabsComponent } from '../../components/floor-tabs.component';
import { Apartment, FLOORS, FloorName, MAINTENANCE_FEE, ResidentInfoApproval, generateBuildingLayout } from '../../models/building';
import { AppSettings, DEFAULT_SETTINGS } from '../../models/settings';

@Component({
  selector: 'app-manage-residents',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, BuildingPlanComponent, FloorTabsComponent],
  template: `
    <div class="min-h-screen bg-slate-100 p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Manage Residents</h1>
          <p class="text-slate-500 text-sm">Maintenance fee per apartment: {{ fee }} LE</p>
        </div>
        <nav class="flex gap-3">
          <a routerLink="/admin/finance" class="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700">Finance →</a>
          <a routerLink="/" class="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm hover:bg-slate-50">View Public Page</a>
        </nav>
      </header>

      @if (needsSeed()) {
        <div class="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-300 flex items-center justify-between">
          <p class="text-amber-800 text-sm">No apartments found in the database yet. Seed the building layout to get started.</p>
          <button (click)="seedBuilding()" [disabled]="seeding()"
            class="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm hover:bg-amber-500 disabled:opacity-50">
            {{ seeding() ? 'Seeding…' : 'Seed Building Layout' }}
          </button>
        </div>
      }

      <div class="mb-6 p-4 rounded-lg bg-white border border-slate-200">
        <p class="text-sm font-semibold text-slate-800 mb-3">Links shown to residents</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Payment URL (shown as "Pay Maintenance" on unpaid apartments)</label>
            <input [(ngModel)]="settingsForm.payment_url" placeholder="https://..."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">WhatsApp Group URL</label>
            <input [(ngModel)]="settingsForm.whatsapp_url" placeholder="https://chat.whatsapp.com/..."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <button (click)="saveSettings()" [disabled]="savingSettings()"
          class="mt-3 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50">
          {{ savingSettings() ? 'Saving…' : 'Save Links' }}
        </button>
      </div>

      <section class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Total Apartments</p>
          <p class="text-2xl font-bold text-slate-800">{{ stats().total }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Paid</p>
          <p class="text-2xl font-bold text-emerald-600">{{ stats().paid }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Unpaid</p>
          <p class="text-2xl font-bold text-red-500">{{ stats().unpaid }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
          <p class="text-slate-500 text-xs uppercase">Rented</p>
          <p class="text-2xl font-bold text-indigo-600">{{ stats().rented }}</p>
        </div>
      </section>

      <section class="bg-white rounded-xl shadow-sm border border-amber-200 p-5 mb-6">
        <div class="flex items-center justify-between mb-4 rounded-lg bg-slate-800 px-3 py-2">
          <h2 class="font-semibold text-white">Pending Resident Information Requests</h2>
          <span class="rounded-full bg-amber-100 text-amber-800 px-2 py-1 text-xs font-semibold">{{ approvals().length }}</span>
        </div>
        @if (!approvals().length) {
          <p class="text-slate-500 text-sm">No pending requests.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-slate-500 uppercase text-xs">
                <tr>
                  <th class="text-left px-3 py-2">Apt #</th>
                  <th class="text-left px-3 py-2">Rented</th>
                  <th class="text-left px-3 py-2">Resident</th>
                  <th class="text-left px-3 py-2">Owner</th>
                  <th class="text-left px-3 py-2">Submitted</th>
                  <th class="text-left px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (request of approvals(); track request.id) {
                  <tr class="border-t border-slate-100">
                    <td class="px-3 py-2 font-semibold">{{ request.apt_number }}</td>
                    <td class="px-3 py-2">{{ request.is_rented ? 'Yes' : 'No' }}</td>
                    <td class="px-3 py-2">{{ request.resident_name || '—' }}<br /><span class="text-slate-400">{{ request.resident_phone || '—' }}</span></td>
                    <td class="px-3 py-2">{{ request.owner_name || '—' }}<br /><span class="text-slate-400">{{ request.owner_phone || '—' }}</span></td>
                    <td class="px-3 py-2 text-slate-500">{{ request.created_at | date: 'short' }}</td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <button type="button" (click)="approveRequest(request)" [disabled]="approvalAction() === request.id"
                        class="text-emerald-600 hover:underline text-xs mr-3">Approve</button>
                      <button type="button" (click)="rejectRequest(request)" [disabled]="approvalAction() === request.id"
                        class="text-red-600 hover:underline text-xs">Reject</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <div class="bg-slate-900 rounded-xl p-4 mb-6">
        <div class="flex gap-3 items-start">
          <app-floor-tabs [floors]="floors" [selected]="selectedFloor()" (floorChange)="selectedFloor.set($event)" />
          <div class="flex-1 min-w-0">
            <app-building-plan [apartments]="apartments()" [floor]="selectedFloor()" [transactions]="finance.transactions()" [showPersonalInfo]="true" [editable]="true" (edit)="openEdit($event)" />
          </div>
        </div>
      </div>

      <input type="text" [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)" placeholder="Search by apartment number, resident or owner…"
        class="w-full mb-4 rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />

      <details [open]="searchTerm().trim().length > 0" class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <summary class="cursor-pointer px-4 py-3 font-semibold text-slate-700">Apartment directory</summary>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th class="text-left px-4 py-3">Apt #</th>
                <th class="text-left px-4 py-3">Floor / Block</th>
                <th class="text-left px-4 py-3">Contact</th>
                <th class="text-left px-4 py-3">Rented</th>
                <th class="text-left px-4 py-3">Paid ({{ fee }} LE)</th>
                <th class="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (apt of filteredApartments(); track apt.apt_number) {
                <tr class="border-t border-slate-100 hover:bg-slate-50">
                  <td class="px-4 py-2 font-semibold text-slate-800">{{ apt.apt_number }}</td>
                  <td class="px-4 py-2 text-slate-500">{{ apt.floor }} · {{ apt.block }}</td>
                  <td class="px-4 py-2">
                    @if (apt.is_rented) {
                      {{ apt.resident_name || '—' }} <span class="text-slate-400">{{ apt.resident_phone }}</span>
                    } @else {
                      {{ apt.owner_name || '—' }} <span class="text-slate-400">{{ apt.owner_phone }}</span>
                    }
                  </td>
                  <td class="px-4 py-2">
                    <button (click)="toggleRented(apt)"
                      class="px-2 py-1 rounded text-xs font-medium"
                      [class.bg-indigo-100]="apt.is_rented" [class.text-indigo-700]="apt.is_rented"
                      [class.bg-slate-100]="!apt.is_rented" [class.text-slate-500]="!apt.is_rented">
                      {{ apt.is_rented ? 'Rented' : 'Owner-occupied' }}
                    </button>
                  </td>
                  <td class="px-4 py-2">
                    <button (click)="togglePaid(apt)"
                      class="px-2 py-1 rounded text-xs font-medium"
                      [class.bg-emerald-100]="apt.has_paid" [class.text-emerald-700]="apt.has_paid"
                      [class.bg-red-100]="!apt.has_paid" [class.text-red-600]="!apt.has_paid">
                      {{ apt.has_paid ? 'Paid' : 'Unpaid' }}
                    </button>
                  </td>
                  <td class="px-4 py-2">
                    <button (click)="openEdit(apt)" class="text-indigo-600 hover:underline text-xs">Edit</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </details>
    </div>

    @if (editing(); as apt) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
          <h2 class="text-lg font-bold text-slate-800 mb-4">Apartment {{ apt.apt_number }}</h2>
          <div class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" [(ngModel)]="editForm.is_rented" />
              Apartment is rented
            </label>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Resident Name</label>
              <input [(ngModel)]="editForm.resident_name" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Resident Phone</label>
              <input [(ngModel)]="editForm.resident_phone" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Owner Name</label>
              <input [(ngModel)]="editForm.owner_name" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Owner Phone</label>
              <input [(ngModel)]="editForm.owner_phone" class="w-full rounded-lg border border-slate-300 px-3 py-2" />
            </div>
          </div>
          <div class="flex justify-end gap-3 mt-6">
            <button (click)="closeEdit()" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm">Cancel</button>
            <button (click)="saveEdit()" [disabled]="saving()"
              class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50">
              {{ saving() ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ManageResidentsComponent implements OnInit {
  readonly fee = MAINTENANCE_FEE;
  readonly floors = FLOORS;

  apartments = signal<Apartment[]>([]);
  searchTerm = signal('');
  selectedFloor = signal<FloorName>('Ground');
  editing = signal<Apartment | null>(null);
  editForm: Partial<Apartment> = {};
  loading = signal(true);
  seeding = signal(false);
  saving = signal(false);
  settingsForm: AppSettings = { ...DEFAULT_SETTINGS };
  savingSettings = signal(false);
  approvals = signal<ResidentInfoApproval[]>([]);
  approvalAction = signal<string | null>(null);

  needsSeed = computed(() => !this.loading() && this.apartments().length === 0);

  filteredApartments = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = [...this.apartments()].sort((a, b) => a.apt_number.localeCompare(b.apt_number));
    if (!term) return list;
    return list.filter(a =>
      a.apt_number.toLowerCase().includes(term) ||
      (a.resident_name ?? '').toLowerCase().includes(term) ||
      (a.owner_name ?? '').toLowerCase().includes(term)
    );
  });

  stats = computed(() => {
    const list = this.apartments();
    return {
      total: list.length,
      paid: list.filter(a => a.has_paid).length,
      unpaid: list.filter(a => !a.has_paid).length,
      rented: list.filter(a => a.is_rented).length,
    };
  });

  constructor(private supabase: SupabaseService, public finance: FinanceService) { }

  async ngOnInit() {
    await Promise.all([this.load(), this.loadApprovals(), this.finance.loadTransactions(), this.loadSettings()]);
  }

  async loadSettings() {
    try {
      this.settingsForm = await this.supabase.getSettings();
    } catch {
      this.settingsForm = { ...DEFAULT_SETTINGS };
    }
  }

  async saveSettings() {
    this.savingSettings.set(true);
    this.settingsForm = await this.supabase.updateSettings(this.settingsForm);
    this.savingSettings.set(false);
  }

  async load() {
    this.loading.set(true);
    const data = await this.supabase.getApartments();
    this.apartments.set(data);
    this.loading.set(false);
  }

  async loadApprovals() {
    this.approvals.set(await this.supabase.getInfoApprovals());
  }

  async seedBuilding() {
    this.seeding.set(true);
    const layout = generateBuildingLayout();
    await this.supabase.upsertApartments(layout);
    await this.load();
    this.seeding.set(false);
  }

  async togglePaid(apt: Apartment) {
    const wasPaid = apt.has_paid;
    const updated = await this.supabase.updateApartment(apt.apt_number, { has_paid: !apt.has_paid });
    this.patchLocal(updated);
    if (!wasPaid && updated.has_paid) await this.recordMaintenancePayment(updated);
  }

  async toggleRented(apt: Apartment) {
    const updated = await this.supabase.updateApartment(apt.apt_number, { is_rented: !apt.is_rented });
    this.patchLocal(updated);
  }

  openEdit(apt: Apartment) {
    this.editing.set(apt);
    this.editForm = { ...apt };
  }

  closeEdit() {
    this.editing.set(null);
  }

  async saveEdit() {
    const apt = this.editing();
    if (!apt) return;
    this.saving.set(true);
    const updated = await this.supabase.updateApartment(apt.apt_number, {
      is_rented: !!this.editForm.is_rented,
      resident_name: this.editForm.resident_name ?? '',
      resident_phone: this.editForm.resident_phone ?? '',
      owner_name: this.editForm.owner_name ?? '',
      owner_phone: this.editForm.owner_phone ?? '',
    });
    this.patchLocal(updated);
    this.saving.set(false);
    this.closeEdit();
  }

  async approveRequest(request: ResidentInfoApproval) {
    if (!request.id) return;
    this.approvalAction.set(request.id);
    try {
      const updated = await this.supabase.approveInfoRequest(request);
      this.patchLocal(updated);
      this.approvals.update(list => list.filter(item => item.id !== request.id));
    } finally {
      this.approvalAction.set(null);
    }
  }

  async rejectRequest(request: ResidentInfoApproval) {
    if (!request.id) return;
    this.approvalAction.set(request.id);
    try {
      await this.supabase.deleteInfoApproval(request.id);
      this.approvals.update(list => list.filter(item => item.id !== request.id));
    } finally {
      this.approvalAction.set(null);
    }
  }

  private async recordMaintenancePayment(apt: Apartment) {
    await this.finance.addTransaction({
      type: 'income',
      amount: this.fee,
      title: `Maintenance - Apt ${apt.apt_number}`,
      apt_number: apt.apt_number,
    });
  }

  private patchLocal(updated: Apartment) {
    this.apartments.update(list => list.map(a => (a.apt_number === updated.apt_number ? updated : a)));
  }
}
