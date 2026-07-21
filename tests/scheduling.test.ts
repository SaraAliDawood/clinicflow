import { describe, it, expect } from 'vitest';
import {
  overlaps,
  hasConflict,
  generateSlots,
  parseHHMM,
  toHHMM,
} from '@/lib/scheduling';

describe('overlaps', () => {
  it('detects overlapping intervals', () => {
    expect(overlaps({ start: 540, end: 600 }, { start: 570, end: 630 })).toBe(true);
  });
  it('treats touching intervals as non-overlapping (half-open)', () => {
    expect(overlaps({ start: 540, end: 600 }, { start: 600, end: 660 })).toBe(false);
  });
});

describe('parseHHMM / toHHMM', () => {
  it('round-trips', () => {
    expect(parseHHMM('09:30')).toBe(570);
    expect(toHHMM(570)).toBe('09:30');
  });
  it('rejects bad input', () => {
    expect(() => parseHHMM('9:30')).toThrow();
    expect(() => parseHHMM('25:00')).toThrow();
  });
});

describe('generateSlots', () => {
  it('splits a working window into fixed slots', () => {
    // 09:00–11:00, 30-min slots → 4 slots
    const slots = generateSlots(540, 660, 30, []);
    expect(slots).toHaveLength(4);
    expect(toHHMM(slots[0].start)).toBe('09:00');
    expect(toHHMM(slots[3].start)).toBe('10:30');
  });

  it('excludes slots that collide with existing appointments', () => {
    // Book 09:30–10:00 → that slot disappears
    const slots = generateSlots(540, 660, 30, [{ start: 570, end: 600 }]);
    expect(slots.map((s) => toHHMM(s.start))).toEqual(['09:00', '10:00', '10:30']);
  });

  it('prevents double-booking (conflict detection)', () => {
    expect(hasConflict({ start: 540, end: 570 }, [{ start: 555, end: 585 }])).toBe(true);
    expect(hasConflict({ start: 540, end: 570 }, [{ start: 600, end: 630 }])).toBe(false);
  });

  it('rejects a non-positive slot length', () => {
    expect(() => generateSlots(540, 660, 0, [])).toThrow();
  });
});
