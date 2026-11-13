import {
  addDays,
  addMonthsISO,
  diffDays,
  eachDay,
  fromISODate,
  isISODate,
  toISODate,
} from "@/lib/dates";

describe("dates", () => {
  it("validates ISO calendar dates", () => {
    expect(isISODate("2026-11-12")).toBe(true);
    expect(isISODate("2028-02-29")).toBe(true);
    expect(isISODate("2026-02-29")).toBe(false);
    expect(isISODate("2026-13-01")).toBe(false);
    expect(isISODate("12/11/2026")).toBe(false);
    expect(isISODate(null)).toBe(false);
  });

  it("adds days across months, years and leap days", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts calendar days regardless of daylight-saving changes", () => {
    expect(diffDays("2026-03-09", "2026-03-07")).toBe(2); // US DST
    expect(diffDays("2026-10-26", "2026-10-24")).toBe(2); // EU DST
    expect(diffDays("2026-01-01", "2026-12-31")).toBe(-364);
  });

  it("round-trips local dates", () => {
    expect(toISODate(fromISODate("2026-11-12"))).toBe("2026-11-12");
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
  });

  it("lists days inclusively and adds months clamping the day", () => {
    expect(eachDay("2026-01-30", "2026-02-02")).toEqual([
      "2026-01-30",
      "2026-01-31",
      "2026-02-01",
      "2026-02-02",
    ]);
    expect(addMonthsISO("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonthsISO("2026-11-15", -12)).toBe("2025-11-15");
  });
});
