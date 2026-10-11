export interface TimeSlot {
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export function isWithinServiceHours(hhmm: number, slots: TimeSlot[]): boolean {
  return slots.some((slot) => {
    if (slot.is_closed || !slot.open_time || !slot.close_time) return false;
    const [oh, om] = slot.open_time.split(":").map(Number);
    const [ch, cm] = slot.close_time.split(":").map(Number);
    const open = oh * 100 + (om || 0);
    const close = ch * 100 + (cm || 0);
    if (close <= open) {
      return hhmm >= open || hhmm <= close;
    }
    return hhmm >= open && hhmm <= close;
  });
}
