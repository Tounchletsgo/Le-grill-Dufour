import { describe, it, expect } from "vitest";
import { isWithinServiceHours, type TimeSlot } from "../opening-hours";

describe("isWithinServiceHours", () => {
  it("accepts order during normal service (12:00–14:00)", () => {
    const slots: TimeSlot[] = [{ open_time: "12:00", close_time: "14:00", is_closed: false }];
    expect(isWithinServiceHours(1230, slots)).toBe(true);
  });

  it("rejects order outside service hours", () => {
    const slots: TimeSlot[] = [{ open_time: "12:00", close_time: "14:00", is_closed: false }];
    expect(isWithinServiceHours(1500, slots)).toBe(false);
  });

  it("accepts order at exact opening time", () => {
    const slots: TimeSlot[] = [{ open_time: "18:00", close_time: "22:00", is_closed: false }];
    expect(isWithinServiceHours(1800, slots)).toBe(true);
  });

  it("accepts order at exact closing time", () => {
    const slots: TimeSlot[] = [{ open_time: "18:00", close_time: "22:00", is_closed: false }];
    expect(isWithinServiceHours(2200, slots)).toBe(true);
  });

  it("handles midnight closing (18:00–00:00) — evening order accepted", () => {
    const slots: TimeSlot[] = [{ open_time: "18:00", close_time: "00:00", is_closed: false }];
    expect(isWithinServiceHours(1900, slots)).toBe(true);
    expect(isWithinServiceHours(2359, slots)).toBe(true);
  });

  it("handles midnight closing (18:00–00:00) — midnight accepted", () => {
    const slots: TimeSlot[] = [{ open_time: "18:00", close_time: "00:00", is_closed: false }];
    expect(isWithinServiceHours(0, slots)).toBe(true);
  });

  it("handles midnight closing (18:00–00:00) — afternoon rejected", () => {
    const slots: TimeSlot[] = [{ open_time: "18:00", close_time: "00:00", is_closed: false }];
    expect(isWithinServiceHours(1500, slots)).toBe(false);
  });

  it("handles past-midnight closing (22:00–02:00)", () => {
    const slots: TimeSlot[] = [{ open_time: "22:00", close_time: "02:00", is_closed: false }];
    expect(isWithinServiceHours(2300, slots)).toBe(true);
    expect(isWithinServiceHours(100, slots)).toBe(true);
    expect(isWithinServiceHours(1500, slots)).toBe(false);
  });

  it("rejects when slot is marked closed", () => {
    const slots: TimeSlot[] = [{ open_time: "12:00", close_time: "14:00", is_closed: true }];
    expect(isWithinServiceHours(1230, slots)).toBe(false);
  });

  it("rejects when times are null", () => {
    const slots: TimeSlot[] = [{ open_time: null, close_time: null, is_closed: false }];
    expect(isWithinServiceHours(1230, slots)).toBe(false);
  });

  it("accepts with multiple service slots (lunch + dinner)", () => {
    const slots: TimeSlot[] = [
      { open_time: "12:00", close_time: "14:00", is_closed: false },
      { open_time: "18:00", close_time: "22:00", is_closed: false },
    ];
    expect(isWithinServiceHours(1230, slots)).toBe(true);
    expect(isWithinServiceHours(1900, slots)).toBe(true);
    expect(isWithinServiceHours(1600, slots)).toBe(false);
  });

  it("rejects with empty slots", () => {
    expect(isWithinServiceHours(1200, [])).toBe(false);
  });
});
