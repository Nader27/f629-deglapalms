import { Component, computed, input } from '@angular/core';
import { normalizeGateCardId } from '../models/building';

@Component({
  selector: 'app-rfid-fob-preview',
  standalone: true,
  template: `
    <div class="fob-preview" aria-label="RFID card preview">
      <svg viewBox="0 0 400 600" role="img" [attr.aria-label]="'RFID card ' + displayCardId()">
        <defs>
          <linearGradient id="fobBodyGradient" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </linearGradient>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="45%" stop-color="#94a3b8" />
            <stop offset="70%" stop-color="#ffffff" />
            <stop offset="100%" stop-color="#475569" />
          </linearGradient>
          <radialGradient id="innerRecess" cx="50%" cy="50%" r="50%">
            <stop offset="82%" stop-color="#020617" stop-opacity="0" />
            <stop offset="100%" stop-color="#020617" stop-opacity="0.45" />
          </radialGradient>
          <filter id="fobShadow" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="14" stdDeviation="10" flood-opacity="0.45" />
          </filter>
        </defs>

        <circle cx="200" cy="110" r="75" stroke="url(#ringGradient)" stroke-width="12" fill="none" filter="url(#fobShadow)" />
        <circle cx="200" cy="110" r="75" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.55" fill="none" />
        <circle cx="200" cy="180" r="42" stroke="url(#ringGradient)" stroke-width="8" fill="none" />
        <circle cx="200" cy="180" r="42" stroke="#ffffff" stroke-width="1" stroke-opacity="0.45" fill="none" />

        <path d="M 200 180 C 260 180 340 270 340 370 A 140 140 0 1 1 60 370 C 60 270 140 180 200 180 Z"
          fill="url(#fobBodyGradient)" filter="url(#fobShadow)" />
        <path d="M 200 183 C 257 183 336 271 336 370 A 136 136 0 1 1 64 370 C 64 271 143 183 200 183 Z"
          stroke="#ffffff" stroke-opacity="0.25" stroke-width="3" fill="none" />
        <rect x="160" y="225" width="80" height="28" rx="14" fill="#020617" opacity="0.85" />
        <rect x="155" y="275" width="16" height="35" rx="8" fill="#020617" opacity="0.2" />
        <rect x="229" y="275" width="16" height="35" rx="8" fill="#020617" opacity="0.2" />

        <circle cx="200" cy="415" r="105" fill="none" stroke="#020617" stroke-opacity="0.3" stroke-width="6" />
        <circle cx="200" cy="415" r="104" fill="url(#innerRecess)" />
        <circle cx="200" cy="415" r="102" stroke="#ffffff" stroke-opacity="0.16" stroke-width="2" fill="none" />
        <text x="201" y="426" text-anchor="middle" dominant-baseline="middle"
          font-family="monospace" font-weight="700" font-size="33" fill="#ffffff" opacity="0.28" letter-spacing="2">
          {{ displayCardId() }}
        </text>
        <text x="200" y="425" text-anchor="middle" dominant-baseline="middle"
          font-family="monospace" font-weight="700" font-size="33" fill="#020617" opacity="0.72" letter-spacing="2">
          {{ displayCardId() }}
        </text>
      </svg>
      <span class="fob-label">RFID CARD</span>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .fob-preview {
      position: relative;
      width: min(190px, 42vw);
      margin-inline: auto;
      padding: 0.75rem;
      border: 1px solid rgb(51 65 85);
      border-radius: 1rem;
      background-color: rgb(15 23 42);
      background-image: linear-gradient(45deg, rgb(30 41 59) 25%, transparent 25%), linear-gradient(-45deg, rgb(30 41 59) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgb(30 41 59) 75%), linear-gradient(-45deg, transparent 75%, rgb(30 41 59) 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
    }

    svg {
      display: block;
      width: 100%;
      height: auto;
    }

    .fob-label {
      display: block;
      color: rgb(148 163 184);
      font: 700 0.6rem/1.2 monospace;
      letter-spacing: 0.16em;
      text-align: center;
    }
  `],
})
export class RfidFobPreviewComponent {
  cardId = input('');

  displayCardId = computed(() => normalizeGateCardId(this.cardId()) ?? '0000000000');
}
