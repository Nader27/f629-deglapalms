import { Component, computed, input, output, signal } from '@angular/core';
import { Apartment, BLOCKS_TOP_TO_BOTTOM, BlockName, FloorName, MAINTENANCE_FEE } from '../models/building';

@Component({
    selector: 'app-building-plan',
    standalone: true,
    template: `
    <div class="flex flex-col lg:flex-row gap-4">
      <div class="flex-1 border-2 border-slate-500 rounded-lg overflow-hidden bg-slate-800">
        @for (block of blocks; track block) {
          <div class="flex items-stretch border-b border-slate-600 last:border-b-0">
            <div class="w-14 shrink-0 flex items-center justify-center text-[10px] text-center uppercase text-slate-400 bg-slate-900/60">
              {{ block }}
            </div>

            <div class="flex-1 grid grid-cols-2 gap-1 p-2">
              @for (apt of leftApts(block); track apt.apt_number) {
                <button type="button" (mouseenter)="hovered.set(apt)" (mouseleave)="hovered.set(null)" (click)="onClick(apt)"
                  class="rounded px-2 py-3 text-xs font-semibold text-center transition"
                  [class.cursor-pointer]="editable()"
                  [class.cursor-default]="!editable()"
                  [class.bg-slate-600]="apt.is_gate"
                  [class.bg-emerald-600]="!apt.is_gate && apt.has_paid"
                  [class.bg-red-600]="!apt.is_gate && !apt.has_paid"
                  [class.ring-2]="hovered() === apt"
                  [class.ring-white]="hovered() === apt">
                  {{ apt.is_gate ? 'GATE' : apt.apt_number }}
                </button>
              }
            </div>

            <div class="w-3 bg-slate-950 shrink-0"></div>

            <div class="flex-1 grid grid-cols-2 gap-1 p-2">
              @for (apt of rightApts(block); track apt.apt_number) {
                <button type="button" (mouseenter)="hovered.set(apt)" (mouseleave)="hovered.set(null)" (click)="onClick(apt)"
                  class="rounded px-2 py-3 text-xs font-semibold text-center transition"
                  [class.cursor-pointer]="editable()"
                  [class.cursor-default]="!editable()"
                  [class.bg-slate-600]="apt.is_gate"
                  [class.bg-emerald-600]="!apt.is_gate && apt.has_paid"
                  [class.bg-red-600]="!apt.is_gate && !apt.has_paid"
                  [class.ring-2]="hovered() === apt"
                  [class.ring-white]="hovered() === apt">
                  {{ apt.is_gate ? 'GATE' : apt.apt_number }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <div class="w-full lg:w-64 shrink-0">
        @if (hovered(); as apt) {
          <div class="bg-slate-800 border border-slate-600 rounded-xl p-4 text-sm sticky top-4">
            <p class="font-bold text-white mb-1">{{ apt.is_gate ? 'Main Gate' : 'Apartment ' + apt.apt_number }}</p>
            <p class="text-slate-400 text-xs mb-2">{{ apt.floor }} · {{ apt.block }} Block</p>
            @if (!apt.is_gate) {
              <p class="mb-1">
                Status:
                <span [class.text-emerald-400]="apt.has_paid" [class.text-red-400]="!apt.has_paid">
                  {{ apt.has_paid ? 'Paid ' + fee + ' LE' : 'Unpaid' }}
                </span>
              </p>
              <p class="mb-1">{{ apt.is_rented ? 'Rented' : 'Owner-occupied' }}</p>
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
    readonly blocks = BLOCKS_TOP_TO_BOTTOM;

    apartments = input.required<Apartment[]>();
    floor = input.required<FloorName>();
    showPersonalInfo = input(false);
    editable = input(false);
    edit = output<Apartment>();

    hovered = signal<Apartment | null>(null);

    floorApts = computed(() => this.apartments().filter(a => a.floor === this.floor()));

    leftApts(block: BlockName) {
        return this.floorApts()
            .filter(a => a.block === block && a.side === 'left')
            .sort((a, b) => a.apt_number.localeCompare(b.apt_number));
    }

    rightApts(block: BlockName) {
        return this.floorApts()
            .filter(a => a.block === block && a.side === 'right')
            .sort((a, b) => a.apt_number.localeCompare(b.apt_number));
    }

    onClick(apt: Apartment) {
        if (this.editable() && !apt.is_gate) this.edit.emit(apt);
    }
}
