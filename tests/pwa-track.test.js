import { describe, expect, test } from 'bun:test';
import { isStandalone } from '../client/events.js';

const win = ({ standalone, media = [] } = {}) => ({ navigator: { standalone }, matchMedia: q => ({ matches: media.includes(q) }) });

describe('isStandalone', () => {
  test('an installed app: display-mode standalone, the desktop window with controls overlay, or iOS navigator.standalone', () => {
    expect(isStandalone(win({ media: ['(display-mode: standalone)'] }))).toBe(true);
    expect(isStandalone(win({ media: ['(display-mode: window-controls-overlay)'] }))).toBe(true);
    expect(isStandalone(win({ standalone: true }))).toBe(true);
  });

  test('a browser tab, or a browser without matchMedia', () => {
    expect(isStandalone(win())).toBe(false);
    expect(isStandalone({ navigator: {} })).toBe(false);
  });
});
