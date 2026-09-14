import { Component, input, output } from '@angular/core';
import { FloorName } from '../models/building';

const FLOOR_ABBR: Record<FloorName, string> = {
    Ground: 'G',
    '1st': 'F1',
    '2nd': 'F2',
    '3rd': 'F3',
    Roof: 'RF',
};

@Component({
    selector: 'app-floor-tabs',
    standalone: true,
    template: `
    <div class="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1 shrink-0">
      @for (floor of floors(); track floor) {
        <button type="button" (click)="floorChange.emit(floor)"
          class="rounded-xl font-bold transition-all duration-150 flex items-center justify-center shrink-0"
          [class.w-14]="selected() === floor"
          [class.h-14]="selected() === floor"
          [class.text-base]="selected() === floor"
          [class.bg-indigo-600]="selected() === floor"
          [class.text-white]="selected() === floor"
          [class.shadow-lg]="selected() === floor"
          [class.w-10]="selected() !== floor"
          [class.h-10]="selected() !== floor"
          [class.text-xs]="selected() !== floor"
          [class.bg-slate-800]="selected() !== floor"
          [class.text-slate-400]="selected() !== floor"
          [class.hover:bg-slate-700]="selected() !== floor">
          {{ abbr(floor) }}
        </button>
      }
    </div>
  `,
})
export class FloorTabsComponent {
    floors = input.required<FloorName[]>();
    selected = input.required<FloorName>();
    floorChange = output<FloorName>();

    abbr(floor: FloorName): string {
        return FLOOR_ABBR[floor];
    }
}
