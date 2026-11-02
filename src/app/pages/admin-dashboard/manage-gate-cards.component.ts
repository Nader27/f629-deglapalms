import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GateCard, normalizeGateCardId } from '../../models/building';
import { SupabaseService } from '../../services/supabase.service';

export interface GateCardCsvImport {
  cards: Pick<GateCard, 'card_id' | 'apt_number'>[];
  warnings: string[];
  errors: string[];
}

function parseCsvRows(csv: string): { rows: string[][]; error?: string } {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let index = 0; index < csv.length; index++) {
    const character = csv[index];
    if (inQuotes) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index++;
      } else if (character === '"') {
        inQuotes = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      inQuotes = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some(value => value.trim())) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (inQuotes) return { rows, error: 'The CSV contains an unclosed quoted field.' };
  row.push(field.replace(/\r$/, ''));
  if (row.some(value => value.trim())) rows.push(row);
  return { rows };
}

function isHeader(row: string[]): boolean {
  const cardHeader = row[0]?.trim().toLowerCase().replace(/[_ -]/g, '');
  const apartmentHeader = row[1]?.trim().toLowerCase().replace(/[_ -]/g, '');
  return ['card', 'cardid', 'cardnumber'].includes(cardHeader)
    && ['apt', 'apartment', 'aptnumber', 'apartmentnumber'].includes(apartmentHeader);
}

export function parseGateCardsCsv(csv: string, apartments: ReadonlySet<string>): GateCardCsvImport {
  const parsed = parseCsvRows(csv);
  if (parsed.error) return { cards: [], warnings: [], errors: [parsed.error] };

  const hasHeader = isHeader(parsed.rows[0] ?? []);
  const rows = hasHeader ? parsed.rows.slice(1) : parsed.rows;
  const cards = new Map<string, Pick<GateCard, 'card_id' | 'apt_number'>>();
  const warnings: string[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + (hasHeader ? 2 : 1);
    const rawCardId = row[0]?.trim() ?? '';
    const aptNumber = row[1]?.trim() ?? '';
    const cardId = normalizeGateCardId(rawCardId);

    if (!cardId) {
      errors.push(`Row ${rowNumber}: card number must contain 1 to 10 digits.`);
      return;
    }

    const normalizedApartment = aptNumber && apartments.has(aptNumber) ? aptNumber : null;
    if (aptNumber && !normalizedApartment) {
      warnings.push(`Row ${rowNumber}: apartment ${aptNumber} was not found and card ${cardId} was left unassigned.`);
    }
    cards.delete(cardId);
    cards.set(cardId, { card_id: cardId, apt_number: normalizedApartment });
  });

  return { cards: [...cards.values()], warnings, errors };
}

@Component({
  selector: 'app-manage-gate-cards',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-slate-100 p-6">
      <header class="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Gate Cards</h1>
          <p class="text-slate-500 text-sm">Assign RFID cards to apartments</p>
        </div>
        <nav class="flex gap-2">
          <a routerLink="/admin/residents" class="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700">← Residents</a>
          <a routerLink="/admin/finance" class="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm hover:bg-slate-50">Finance →</a>
          <a routerLink="/" class="px-4 py-2 rounded-lg bg-white border border-slate-300 text-sm hover:bg-slate-50">Public Page</a>
        </nav>
      </header>

      <section class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mb-6">
        <h2 class="font-semibold text-slate-800 mb-4">Assign a Card</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label class="block text-xs text-slate-500 mb-1">Apartment</label>
            <select [(ngModel)]="form.apt_number" class="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white">
              <option value="">Select apartment</option>
              @for (apt of apartments(); track apt.apt_number) {
                <option [value]="apt.apt_number">Apartment {{ apt.apt_number }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Numeric RFID Card ID</label>
            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              [(ngModel)]="form.card_id"
              placeholder="0002379787"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono" />
          </div>
          <button (click)="assignCard()" [disabled]="saving()"
            class="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm hover:bg-indigo-500 disabled:opacity-50">
            {{ saving() ? 'Assigning…' : 'Assign Card' }}
          </button>
        </div>
        <div class="mt-5 border-t border-slate-200 pt-4">
          <h3 class="font-semibold text-slate-800 mb-2">Import cards from CSV</h3>
          <p class="text-xs text-slate-500 mb-3">Use card number and apartment number columns. Card numbers are stored as 10 digits; missing leading zeros are added automatically. Apartment can be empty to leave a card unassigned.</p>
          <div class="flex flex-wrap items-center gap-3">
            <label for="gate-card-csv" class="cursor-pointer rounded-lg bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700">
              Choose CSV
            </label>
            <span class="text-sm text-slate-500">{{ selectedCsvFile?.name || 'No CSV selected' }}</span>
            <input id="gate-card-csv" type="file" accept=".csv,text/csv" (change)="onCsvSelected($event)" class="sr-only" />
            <button (click)="importCsv()" [disabled]="importing() || !selectedCsvFile"
              class="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm hover:bg-emerald-500 disabled:opacity-50">
              {{ importing() ? 'Importing…' : 'Import CSV' }}
            </button>
          </div>
        </div>
        @if (message()) {
          <p class="mt-3 text-sm" [class.text-emerald-600]="messageType() === 'success'" [class.text-red-600]="messageType() === 'error'">
            {{ message() }}
          </p>
        }
      </section>

      <section class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-4 border-b border-slate-200">
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search by card ID or apartment…"
            class="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        @if (loading()) {
          <p class="p-4 text-slate-500 text-sm">Loading cards…</p>
        } @else if (!filteredCards().length) {
          <p class="p-4 text-slate-500 text-sm">No gate cards found.</p>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th class="text-left px-4 py-3">Card ID</th>
                  <th class="text-left px-4 py-3">Apartment</th>
                  <th class="text-left px-4 py-3">Assigned</th>
                  <th class="text-right px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (card of filteredCards(); track card.id) {
                  <tr class="border-t border-slate-100">
                    <td class="px-4 py-3 font-mono font-semibold text-slate-800">{{ card.card_id }}</td>
                    <td class="px-4 py-3">{{ card.apt_number ? 'Apartment ' + card.apt_number : 'Unassigned' }}</td>
                    <td class="px-4 py-3 text-slate-500">{{ card.created_at ? formatDate(card.created_at) : '—' }}</td>
                    <td class="px-4 py-3 text-right">
                      <button (click)="removeCard(card)" [disabled]="removingId() === card.id"
                        class="text-red-600 hover:underline text-xs disabled:opacity-50">
                        {{ removingId() === card.id ? 'Removing…' : 'Remove' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </div>
  `,
})
export class ManageGateCardsComponent implements OnInit {
  apartments = signal<{ apt_number: string }[]>([]);
  cards = signal<GateCard[]>([]);
  loading = signal(true);
  saving = signal(false);
  removingId = signal<string | null>(null);
  importing = signal(false);
  searchTerm = '';
  message = signal('');
  messageType = signal<'success' | 'error'>('success');
  selectedCsvFile: File | null = null;
  form = { apt_number: '', card_id: '' };

  filteredCards = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();
    return [...this.cards()]
      .filter(card => !term || card.card_id.includes(term) || (card.apt_number ?? '').toLowerCase().includes(term))
      .sort((a, b) => (a.apt_number ?? '').localeCompare(b.apt_number ?? '') || a.card_id.localeCompare(b.card_id));
  });

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await Promise.all([this.loadApartments(), this.loadCards()]);
  }

  async loadApartments() {
    const apartments = await this.supabase.getApartments();
    this.apartments.set([...apartments].sort((a, b) => a.apt_number.localeCompare(b.apt_number)));
  }

  async loadCards() {
    this.loading.set(true);
    try {
      this.cards.set(await this.supabase.getGateCards());
    } finally {
      this.loading.set(false);
    }
  }

  async assignCard() {
    const aptNumber = this.form.apt_number.trim();
    const cardId = this.form.card_id.trim();
    this.message.set('');

    const normalizedCardId = normalizeGateCardId(cardId);
    if (!aptNumber || !normalizedCardId) {
      this.messageType.set('error');
      this.message.set('Select an apartment and enter an RFID card number containing up to 10 digits. Missing leading zeros will be added automatically.');
      return;
    }

    this.saving.set(true);
    try {
      await this.supabase.addGateCard(aptNumber, normalizedCardId);
      this.form.card_id = '';
      this.messageType.set('success');
      this.message.set(`Card ${normalizedCardId} assigned to apartment ${aptNumber}.`);
      await this.loadCards();
    } catch (error) {
      this.messageType.set('error');
      const databaseError = error as { code?: string; message?: string };
      this.message.set(databaseError.code === '23505'
        ? `Card ID ${normalizedCardId} is already assigned.`
        : (databaseError.message || 'Could not assign the card.'));
    } finally {
      this.saving.set(false);
    }
  }

  onCsvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedCsvFile = input.files?.[0] ?? null;
    this.message.set('');
  }

  async importCsv() {
    if (!this.selectedCsvFile) return;
    this.importing.set(true);
    this.message.set('');

    try {
      const csv = await this.selectedCsvFile.text();
      const apartmentNumbers = new Set(this.apartments().map(apt => apt.apt_number));
      const parsed = parseGateCardsCsv(csv, apartmentNumbers);
      if (parsed.errors.length) {
        this.messageType.set('error');
        this.message.set(parsed.errors.join(' '));
        return;
      }
      if (!parsed.cards.length) {
        this.messageType.set('error');
        this.message.set('The CSV does not contain any card rows.');
        return;
      }

      const importedCards = await this.supabase.upsertGateCards(parsed.cards);
      const importedByCardId = new Map(importedCards.map(card => [card.card_id, card]));
      this.cards.update(existing => {
        const remaining = existing.filter(card => !importedByCardId.has(card.card_id));
        return [...remaining, ...importedCards];
      });
      this.selectedCsvFile = null;
      this.messageType.set('success');
      this.message.set(`Imported ${importedCards.length} card${importedCards.length === 1 ? '' : 's'}.${parsed.warnings.length ? ` ${parsed.warnings.join(' ')}` : ''}`);
    } catch (error) {
      this.messageType.set('error');
      this.message.set((error as { message?: string }).message || 'Could not import the CSV file.');
    } finally {
      this.importing.set(false);
    }
  }

  async removeCard(card: GateCard) {
    if (!card.id || !confirm(`Remove Card ID ${card.card_id} from ${card.apt_number ? `apartment ${card.apt_number}` : 'unassigned cards'}?`)) return;
    this.removingId.set(card.id);
    try {
      await this.supabase.deleteGateCard(card.id);
      await this.loadCards();
    } catch (error) {
      this.messageType.set('error');
      this.message.set((error as { message?: string }).message || 'Could not remove the card.');
    } finally {
      this.removingId.set(null);
    }
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString();
  }
}
