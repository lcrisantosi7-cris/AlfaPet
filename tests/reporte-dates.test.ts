import { describe, expect, it } from "vitest";
import { addDays, buildBuckets, diffDays } from "../app/modules/reportes/model/reporte-dates";

describe("reporte-dates", () => {
  it("calcula diferencias y suma de días sin desplazamiento de zona horaria", () => {
    expect(diffDays("2026-01-01", "2026-01-31")).toBe(30);
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
  });

  it("agrupa periodos cortos por día", () => {
    const buckets = buildBuckets("2026-01-01", "2026-01-03");
    expect(buckets.mode).toBe("day");
    expect(buckets.size).toBe(3);
    const values = [0, 0, 0];
    buckets.bump(values, "2026-01-02T16:00:00.000Z", 4);
    expect(values).toEqual([0, 4, 0]);
  });

  it("usa semana y mes en periodos largos", () => {
    expect(buildBuckets("2026-01-01", "2026-03-01").mode).toBe("week");
    expect(buildBuckets("2026-01-01", "2027-01-01").mode).toBe("month");
  });
});
