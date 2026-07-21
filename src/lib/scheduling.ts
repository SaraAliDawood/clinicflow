/**
 * Pure scheduling logic — the heart of ClinicFlow, and fully unit-testable
 * with no database. Handles slot generation from a provider's working hours
 * and prevents double-booking via interval-overlap detection.
 *
 * All times are minutes-from-midnight (integers) to keep the math exact and
 * timezone-free; the caller maps them onto a concrete date.
 */

export interface Interval {
  start: number; // minutes from midnight, inclusive
  end: number; // minutes from midnight, exclusive
}

/** Two half-open intervals [start,end) overlap iff a.start < b.end && b.start < a.end. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Does `candidate` collide with any existing (non-cancelled) appointment? */
export function hasConflict(candidate: Interval, existing: Interval[]): boolean {
  return existing.some((e) => overlaps(candidate, e));
}

export function parseHHMM(value: string): number {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) throw new Error(`Invalid time: ${value}`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) throw new Error(`Invalid time: ${value}`);
  return h * 60 + min;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Generate bookable slots for one working window, excluding any that collide
 * with existing appointments. `slotMinutes` is the appointment length.
 */
export function generateSlots(
  workStart: number,
  workEnd: number,
  slotMinutes: number,
  existing: Interval[],
): Interval[] {
  if (slotMinutes <= 0) throw new Error('slotMinutes must be positive.');
  const slots: Interval[] = [];
  for (let start = workStart; start + slotMinutes <= workEnd; start += slotMinutes) {
    const slot = { start, end: start + slotMinutes };
    if (!hasConflict(slot, existing)) slots.push(slot);
  }
  return slots;
}
