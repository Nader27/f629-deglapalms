import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Apartment, BLOCKS_TOP_TO_BOTTOM, BlockName, FloorName, MAINTENANCE_FEE, apartmentSide } from '../models/building';
import { Transaction } from '../services/finance.service';
import { TranslationService } from '../services/translation.service';

interface BlockMeta {
  titleKey: string;
  icon: string;
  stairwellKey: string | null;
  stairwellEndKey: string | null;
  titlePosition: 'top' | 'bottom';
  titleClass: string;
}

// Blocks 1-3 share one continuous amber frame; Block 4 (South) gets its own separate blue frame.
const BLOCK_META: Record<BlockName, BlockMeta> = {
  North: { titleKey: 'block1Title', icon: '🏢', stairwellKey: 'stairwell1', stairwellEndKey: null, titlePosition: 'top', titleClass: 'text-amber-400' },
  Second: { titleKey: 'block2Title', icon: '', stairwellKey: null, stairwellEndKey: null, titlePosition: 'top', titleClass: 'text-amber-400' },
  Third: { titleKey: 'block3Title', icon: '', stairwellKey: null, stairwellEndKey: 'stairwell2', titlePosition: 'top', titleClass: 'text-amber-400' },
  South: { titleKey: 'block4Title', icon: '🏢', stairwellKey: 'stairwell3', stairwellEndKey: null, titlePosition: 'bottom', titleClass: 'text-blue-400' },
};

const FRAME_CLASS: Record<BlockName, string> = {
  North: 'rounded-t-2xl border-t-2 border-x-2 border-amber-500',
  Second: 'border-x-2 border-amber-500',
  Third: 'border-x-2 border-b-2 border-amber-500',
  South: 'rounded-2xl border-2 border-blue-500',
};

type Connector = 'hallway' | 'courtyard' | null;

@Component({
  selector: 'app-building-plan',
  standalone: true,
  template: `
    <div class="space-y-0" dir="ltr">
      @for (row of rows(); track row.block) {
          <div class="p-2.5 sm:p-3 bg-slate-800" [class]="frameClass(row.block)">
            @if (meta(row.block).titlePosition === 'top') {
              <p class="text-center text-xs font-bold mb-1.5" [class]="meta(row.block).titleClass">
                {{ meta(row.block).icon }} {{ t.t(meta(row.block).titleKey) }}
              </p>
            }

            @if (meta(row.block).stairwellKey) {
              <div class="mx-auto w-fit px-2.5 py-0.5 rounded-full bg-slate-700 text-[9px] font-mono tracking-widest text-amber-300 mb-2">
                ▒ {{ t.t(meta(row.block).stairwellKey!) }} ▒
              </div>
            }

            <div class="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-2 justify-items-center">
              <div class="flex flex-col gap-2 h-34 sm:h-42 items-center">
                @for (slot of leftSlots(row.block); track $index) {
                  @if (slot.apt; as apt) {
                    <button type="button" (mouseenter)="hovered.set(apt)" (mouseleave)="hovered.set(null)" (click)="onClick(apt)"
                      class="relative flex-1 w-16 sm:w-20 flex items-center justify-center rounded-lg text-center transition"
                      [class]="tileClasses(apt)"
                      [class.text-base]="slot.solo"
                      [class.font-bold]="slot.solo"
                      [class.ring-2]="hovered() === apt"
                      [class.ring-white]="hovered() === apt"
                      [class.text-xs]="!slot.solo"
                      [class.font-semibold]="!slot.solo"
                      [class.cursor-pointer]="editable()"
                      [class.cursor-default]="!editable()">
                      {{ apt.apt_number }}
                      @if (apt.has_paid) {
                        <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] leading-none flex items-center justify-center shadow">✓</span>
                      }
                    </button>
                  } @else {
                    <div class="flex-1 w-16 sm:w-20 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/40"></div>
                  }
                }
              </div>
              <div class="flex flex-col gap-2 h-34 sm:h-42 items-center">
                @for (slot of rightSlots(row.block); track $index) {
                  @if (slot.apt; as apt) {
                    <button type="button" (mouseenter)="hovered.set(apt)" (mouseleave)="hovered.set(null)" (click)="onClick(apt)"
                      class="relative flex-1 w-16 sm:w-20 flex items-center justify-center rounded-lg text-center transition"
                      [class]="tileClasses(apt)"
                      [class.text-base]="slot.solo"
                      [class.font-bold]="slot.solo"
                      [class.ring-2]="hovered() === apt"
                      [class.ring-white]="hovered() === apt"
                      [class.text-xs]="!slot.solo"
                      [class.font-semibold]="!slot.solo"
                      [class.cursor-pointer]="editable()"
                      [class.cursor-default]="!editable()">
                      {{ apt.apt_number }}
                      @if (apt.has_paid) {
                        <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] leading-none flex items-center justify-center shadow">✓</span>
                      }
                    </button>
                  } @else {
                    <div class="flex-1 w-16 sm:w-20 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/40"></div>
                  }
                }
              </div>
            </div>

            @if (meta(row.block).stairwellEndKey) {
              <div class="mx-auto w-fit px-2.5 py-0.5 rounded-full bg-slate-700 text-[9px] font-mono tracking-widest text-amber-300 mt-2">
                ▒ {{ t.t(meta(row.block).stairwellEndKey!) }} ▒
              </div>
            }

            @if (meta(row.block).titlePosition === 'bottom') {
              <p class="text-center text-xs font-bold mt-2" [class]="meta(row.block).titleClass">
                {{ meta(row.block).icon }} {{ t.t(meta(row.block).titleKey) }}
              </p>
            }
          </div>

          @if (row.connectorAfter === 'hallway') {
            <div class="flex flex-col items-center py-1 border-x-2 border-amber-500 bg-slate-800">
              <div class="w-1 h-3 bg-slate-600"></div>
              <div class="px-4 py-1 rounded-full bg-slate-900 border border-slate-600 text-[10px] text-slate-400 font-bold tracking-wide whitespace-nowrap">
                ═ {{ t.t('hallway') }} ═
              </div>
              <div class="w-1 h-3 bg-slate-600"></div>
            </div>
          } @else if (row.connectorAfter === 'courtyard') {
            <div class="flex items-center gap-2 py-3">
              <div class="flex-1 border-t-2 border-dashed border-slate-600"></div>
              <span class="text-[10px] text-slate-500 font-bold tracking-wide whitespace-nowrap">↔ {{ t.t('disconnectedCourtyard') }} ↔</span>
              <div class="flex-1 border-t-2 border-dashed border-slate-600"></div>
            </div>
          }
        }
      </div>

    @if (selected(); as apt) {
      <div class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" [attr.dir]="t.dir()" (click)="closeModal()">
        <div class="bg-slate-800 border border-slate-600 rounded-xl p-5 text-sm w-full max-w-sm relative" (click)="$event.stopPropagation()">
          <button type="button" (click)="closeModal()" [attr.aria-label]="t.t('close')"
            class="absolute top-3 right-3 w-7 h-7 rounded-full bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center">✕</button>
          <p class="font-bold text-white mb-1 pr-8">{{ t.t('apartmentLabel') }} {{ apt.apt_number }}</p>
          <p class="text-slate-400 text-xs mb-2">{{ apt.floor }} · {{ t.t(meta(apt.block).titleKey) }}</p>
          <p class="mb-1">
            {{ t.t('status') }}:
            <span [class.text-emerald-400]="apt.has_paid" [class.text-red-400]="!apt.has_paid">
              {{ apt.has_paid ? '✓ ' + t.t('paid') + ' ' + fee + ' LE' : t.t('unpaid') }}
            </span>
          </p>
          <p class="mb-1">{{ hasInfo(apt) ? (apt.is_rented ? t.t('rented') : t.t('ownerOccupied')) : t.t('noInfoOnFile') }}</p>
          @if (!apt.has_paid && paymentUrl()) {
            <a [href]="paymentUrl()" target="_blank" rel="noopener"
              class="block text-center mt-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
              💳 {{ t.t('payMaintenance') }} ({{ fee }} LE)
            </a>
          }
          @if (aptPayments(apt).length) {
            <details class="mt-3 rounded-lg bg-slate-900/60 border border-slate-700 p-3">
              <summary class="cursor-pointer text-xs text-slate-300 uppercase">{{ t.t('paymentsLinked') }}</summary>
              <p class="text-emerald-400 font-bold text-lg mt-2 mb-2">{{ aptPaymentsTotal(apt) }} LE</p>
              @for (payment of aptPayments(apt); track payment.id) {
                <div class="flex justify-between text-xs text-slate-300 py-0.5">
                  <span>{{ payment.title }}</span>
                  <span>{{ payment.amount }} LE</span>
                </div>
              }
            </details>
          }
          @if (showPersonalInfo()) {
            <hr class="my-2 border-slate-700" />
            @if (apt.is_rented) {
              <p>{{ t.t('resident') }}: {{ apt.resident_name || '—' }}</p>
              <p>{{ t.t('phone') }}: {{ apt.resident_phone || '—' }}</p>
              <p>{{ t.t('owner') }}: {{ apt.owner_name || '—' }}</p>
              <p>{{ t.t('phone') }}: {{ apt.owner_phone || '—' }}</p>
            } @else {
              <p>{{ t.t('owner') }}: {{ apt.owner_name || '—' }}</p>
              <p>{{ t.t('phone') }}: {{ apt.owner_phone || '—' }}</p>
            }
          }
          @if (editable()) {
            <button type="button" (click)="requestEdit(apt)"
              class="w-full mt-3 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
              {{ t.t('editApartment') }}
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class BuildingPlanComponent {
  readonly fee = MAINTENANCE_FEE;
  readonly t = inject(TranslationService);

  apartments = input.required<Apartment[]>();
  floor = input.required<FloorName>();
  showPersonalInfo = input(false);
  editable = input(false);
  transactions = input<Transaction[]>([]);
  paymentUrl = input<string | null>(null);
  edit = output<Apartment>();

  hovered = signal<Apartment | null>(null);
  selected = signal<Apartment | null>(null);

  floorApts = computed(() => this.apartments().filter(a => a.floor === this.floor()));

  visibleBlocks = computed(() => BLOCKS_TOP_TO_BOTTOM);

  rows = computed(() => {
    const list = this.visibleBlocks();
    return list.map((block, i) => ({
      block,
      connectorAfter: i < list.length - 1 ? this.connectorType(block, list[i + 1]) : (null as Connector),
    }));
  });

  meta(block: BlockName): BlockMeta {
    return BLOCK_META[block];
  }

  frameClass(block: BlockName): string {
    return FRAME_CLASS[block];
  }

  hasInfo(apt: Apartment): boolean {
    return !!(apt.resident_name?.trim() || apt.owner_name?.trim());
  }

  aptPayments(apt: Apartment): Transaction[] {
    return this.transactions().filter(t => t.type === 'income' && t.apt_number === apt.apt_number);
  }

  aptPaymentsTotal(apt: Apartment): number {
    return this.aptPayments(apt).reduce((sum, t) => sum + Number(t.amount), 0);
  }

  tileClasses(apt: Apartment): string {
    if (!this.hasInfo(apt)) return 'bg-slate-700 text-slate-300';
    return apt.is_rented ? 'bg-violet-700 text-violet-100' : 'bg-sky-700 text-sky-100';
  }

  leftApts(block: BlockName) {
    // Descending: within a block the higher number sits on top (e.g. 110 above 109, 116 above 115).
    return this.floorApts()
      .filter(a => a.block === block && apartmentSide(a) === 'left')
      .sort((a, b) => b.apt_number.localeCompare(a.apt_number));
  }

  rightApts(block: BlockName) {
    return this.floorApts()
      .filter(a => a.block === block && apartmentSide(a) === 'right')
      .sort((a, b) => a.apt_number.localeCompare(b.apt_number));
  }

  // Normally 2 slots per side; an empty side (e.g. Roof) shows 2 disabled placeholders, and a lone
  // apartment (e.g. Ground's 015, now that the gate slot is gone) stretches to fill both.
  leftSlots(block: BlockName): { apt: Apartment | null; solo: boolean }[] {
    return this.toSlots(this.leftApts(block));
  }

  rightSlots(block: BlockName): { apt: Apartment | null; solo: boolean }[] {
    return this.toSlots(this.rightApts(block));
  }

  private toSlots(apts: Apartment[]): { apt: Apartment | null; solo: boolean }[] {
    if (apts.length === 0) return [{ apt: null, solo: false }, { apt: null, solo: false }];
    if (apts.length === 1) return [{ apt: apts[0], solo: true }];
    return apts.map(apt => ({ apt, solo: false }));
  }

  private connectorType(a: BlockName, b: BlockName): Connector {
    return a === 'Third' && b === 'South' ? 'courtyard' : 'hallway';
  }

  onClick(apt: Apartment) {
    this.hovered.set(apt);
    this.selected.set(apt);
  }

  closeModal() {
    this.selected.set(null);
  }

  requestEdit(apt: Apartment) {
    this.edit.emit(apt);
    this.closeModal();
  }
}
