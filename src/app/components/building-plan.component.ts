import { Component, computed, input, output, signal } from '@angular/core';
import { Apartment, BLOCKS_TOP_TO_BOTTOM, BlockName, FloorName, MAINTENANCE_FEE, apartmentSide } from '../models/building';

interface BlockMeta {
    title: string;
    icon: string;
    stairwell: string | null;
    borderClass: string;
    titleClass: string;
}

const BLOCK_META: Record<BlockName, BlockMeta> = {
    North: { title: 'Block 1 — Back Entrance', icon: '🚪', stairwell: 'Stairwell 1', borderClass: 'border-2 border-amber-500', titleClass: 'text-amber-400' },
    Second: { title: 'Block 2 — Back Section', icon: '', stairwell: null, borderClass: 'border-2 border-dashed border-amber-500/70', titleClass: 'text-amber-400' },
    Third: { title: 'Block 3 — Back Section', icon: '', stairwell: null, borderClass: 'border-2 border-dashed border-amber-500/70', titleClass: 'text-amber-400' },
    South: { title: 'Block 4 — Front Entrance', icon: '🏢', stairwell: 'Stairwell 2', borderClass: 'border-2 border-blue-500', titleClass: 'text-blue-400' },
};

type Connector = 'hallway' | 'courtyard' | null;

@Component({
    selector: 'app-building-plan',
    standalone: true,
    template: `
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1 space-y-0">
        @for (row of rows(); track row.block) {
          <div class="rounded-2xl p-4 bg-slate-800" [class]="meta(row.block).borderClass">
            <p class="text-center text-sm font-bold mb-2" [class]="meta(row.block).titleClass">
              {{ meta(row.block).icon }} {{ meta(row.block).title }}
            </p>

            @if (meta(row.block).stairwell) {
              <div class="mx-auto w-fit px-3 py-1 rounded-full bg-slate-700 text-[10px] font-mono tracking-widest text-amber-300 mb-3">
                ▒ {{ meta(row.block).stairwell }} ▒
              </div>
            }

            <div class="grid grid-cols-2 gap-x-10 gap-y-3">
              <div class="space-y-3">
                @for (apt of leftSlots(row.block); track $index) {
                  @if (apt) {
                    <button type="button" (mouseenter)="hovered.set(apt)" (mouseleave)="hovered.set(null)" (click)="onClick(apt)"
                      class="relative aspect-square w-full flex items-center justify-center rounded-lg text-sm font-semibold text-center transition"
                      [class]="tileClasses(apt)"
                      [class.cursor-pointer]="editable()"
                      [class.cursor-default]="!editable()"
                      [class.ring-2]="hovered() === apt"
                      [class.ring-white]="hovered() === apt">
                      {{ apt.is_gate ? 'GATE' : 'Apt ' + apt.apt_number }}
                      @if (!apt.is_gate && apt.has_paid) {
                        <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] leading-none flex items-center justify-center shadow">✓</span>
                      }
                    </button>
                  } @else {
                    <div class="aspect-square w-full rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/40"></div>
                  }
                }
              </div>
              <div class="space-y-3">
                @for (apt of rightSlots(row.block); track $index) {
                  @if (apt) {
                    <button type="button" (mouseenter)="hovered.set(apt)" (mouseleave)="hovered.set(null)" (click)="onClick(apt)"
                      class="relative aspect-square w-full flex items-center justify-center rounded-lg text-sm font-semibold text-center transition"
                      [class]="tileClasses(apt)"
                      [class.cursor-pointer]="editable()"
                      [class.cursor-default]="!editable()"
                      [class.ring-2]="hovered() === apt"
                      [class.ring-white]="hovered() === apt">
                      {{ apt.is_gate ? 'GATE' : 'Apt ' + apt.apt_number }}
                      @if (!apt.is_gate && apt.has_paid) {
                        <span class="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[11px] leading-none flex items-center justify-center shadow">✓</span>
                      }
                    </button>
                  } @else {
                    <div class="aspect-square w-full rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/40"></div>
                  }
                }
              </div>
            </div>
          </div>

          @if (row.connectorAfter === 'hallway') {
            <div class="flex flex-col items-center py-1">
              <div class="w-1 h-3 bg-slate-600"></div>
              <div class="px-4 py-1 rounded-full bg-slate-900 border border-slate-600 text-[10px] text-slate-400 font-bold tracking-wide whitespace-nowrap">
                ═ HALLWAY ═
              </div>
              <div class="w-1 h-3 bg-slate-600"></div>
            </div>
          } @else if (row.connectorAfter === 'courtyard') {
            <div class="flex items-center gap-2 py-3">
              <div class="flex-1 border-t-2 border-dashed border-slate-600"></div>
              <span class="text-[10px] text-slate-500 font-bold tracking-wide whitespace-nowrap">↔ DISCONNECTED COURTYARD ↔</span>
              <div class="flex-1 border-t-2 border-dashed border-slate-600"></div>
            </div>
          }
        }
      </div>

      <div class="w-full lg:w-64 shrink-0">
        @if (hovered(); as apt) {
          <div class="bg-slate-800 border border-slate-600 rounded-xl p-4 text-sm sticky top-4">
            <p class="font-bold text-white mb-1">{{ apt.is_gate ? 'Main Gate' : 'Apartment ' + apt.apt_number }}</p>
            <p class="text-slate-400 text-xs mb-2">{{ apt.floor }} · {{ meta(apt.block).title }}</p>
            @if (!apt.is_gate) {
              <p class="mb-1">
                Status:
                <span [class.text-emerald-400]="apt.has_paid" [class.text-red-400]="!apt.has_paid">
                  {{ apt.has_paid ? '✓ Paid ' + fee + ' LE' : 'Unpaid' }}
                </span>
              </p>
              <p class="mb-1">{{ hasInfo(apt) ? (apt.is_rented ? 'Rented' : 'Owner-occupied') : 'No info on file' }}</p>
              @if (showPersonalInfo()) {
                <hr class="my-2 border-slate-700" />
                <p>Resident: {{ apt.resident_name || '—' }}</p>
                <p>Phone: {{ apt.resident_phone || '—' }}</p>
                <p>Owner: {{ apt.owner_name || '—' }}</p>
              }
              @if (editable()) {
                <p class="text-indigo-400 text-xs mt-3">Click the apartment to edit →</p>
              }
            }
          </div>
        } @else {
          <div class="bg-slate-800/50 border border-dashed border-slate-700 rounded-xl p-4 text-sm text-slate-500">
            Hover an apartment to see its details.
          </div>
        }
      </div>
    </div>
  `,
})
export class BuildingPlanComponent {
    readonly fee = MAINTENANCE_FEE;

    apartments = input.required<Apartment[]>();
    floor = input.required<FloorName>();
    showPersonalInfo = input(false);
    editable = input(false);
    edit = output<Apartment>();

    hovered = signal<Apartment | null>(null);

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

    hasInfo(apt: Apartment): boolean {
        return !!(apt.resident_name?.trim() || apt.owner_name?.trim());
    }

    tileClasses(apt: Apartment): string {
        if (apt.is_gate) return 'bg-slate-600 text-slate-200';
        if (!this.hasInfo(apt)) return 'bg-slate-700 text-slate-300';
        return apt.is_rented ? 'bg-violet-700 text-violet-100' : 'bg-sky-700 text-sky-100';
    }

    leftApts(block: BlockName) {
        return this.floorApts()
            .filter(a => a.block === block && apartmentSide(a) === 'left')
            .sort((a, b) => (b.is_gate ? 1 : 0) - (a.is_gate ? 1 : 0) || a.apt_number.localeCompare(b.apt_number));
    }

    rightApts(block: BlockName) {
        return this.floorApts()
            .filter(a => a.block === block && apartmentSide(a) === 'right')
            .sort((a, b) => a.apt_number.localeCompare(b.apt_number));
    }

    // Roof (and any other floor with a shorter column) still renders 2 slots per side; missing ones become disabled squares.
    leftSlots(block: BlockName): (Apartment | null)[] {
        return this.padTo2(this.leftApts(block));
    }

    rightSlots(block: BlockName): (Apartment | null)[] {
        return this.padTo2(this.rightApts(block));
    }

    private padTo2(apts: Apartment[]): (Apartment | null)[] {
        const slots: (Apartment | null)[] = [...apts];
        while (slots.length < 2) slots.push(null);
        return slots;
    }

    private connectorType(a: BlockName, b: BlockName): Connector {
        return a === 'Third' && b === 'South' ? 'courtyard' : 'hallway';
    }

    onClick(apt: Apartment) {
        if (this.editable() && !apt.is_gate) this.edit.emit(apt);
    }
}
