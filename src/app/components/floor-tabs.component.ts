import { Component, inject, input, output } from '@angular/core';
import { FloorName } from '../models/building';
import { TranslationService } from '../services/translation.service';

const FLOOR_ABBR_KEY: Record<FloorName, string> = {
  Ground: 'floorGroundShort',
  '1st': 'floor1stShort',
  '2nd': 'floor2ndShort',
  '3rd': 'floor3rdShort',
  Roof: 'floorRoofShort',
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
  readonly t = inject(TranslationService);

  floors = input.required<FloorName[]>();
  selected = input.required<FloorName>();
  floorChange = output<FloorName>();

  abbr(floor: FloorName): string {
    return this.t.t(FLOOR_ABBR_KEY[floor]);
  }
}
