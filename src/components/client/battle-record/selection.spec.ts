import { describe, it, expect } from "vitest";
import {
  backCount,
  cycleMember,
  cycleOpponentRole,
  emptySelection,
  memberState,
  selectionFromIndices,
  selectionLimits,
  selectionToIndices,
  type Selection,
} from "./selection";

describe("selectionLimits", () => {
  it("doubles: maxBack=4, leadCount=2", () => {
    expect(selectionLimits("doubles")).toEqual({ maxBack: 4, leadCount: 2 });
  });
  it("singles: maxBack=3, leadCount=1", () => {
    expect(selectionLimits("singles")).toEqual({ maxBack: 3, leadCount: 1 });
  });
});

describe("cycleMember", () => {
  it("cycles unused -> back -> lead -> unused", () => {
    const s0 = emptySelection;
    const s1 = cycleMember(s0, 3, "doubles");
    expect(memberState(s1, 3)).toBe("back");
    const s2 = cycleMember(s1, 3, "doubles");
    expect(memberState(s2, 3)).toBe("lead");
    const s3 = cycleMember(s2, 3, "doubles");
    expect(memberState(s3, 3)).toBe("unused");
  });

  it("does not add more than maxBack", () => {
    let s: Selection = emptySelection;
    for (const i of [0, 1, 2, 3]) s = cycleMember(s, i, "doubles"); // 4 backs
    const before = s;
    s = cycleMember(s, 4, "doubles"); // 5th should be rejected
    expect(s).toBe(before);
    expect(memberState(s, 4)).toBe("unused");
  });

  it("removes from selection when leads are full (back with no lead room)", () => {
    // singles: leadCount=1
    let s = cycleMember(emptySelection, 0, "singles"); // back
    s = cycleMember(s, 0, "singles"); // lead (leads now full)
    // build: 0 is lead, 1 is back, tapping 1 -> leads full -> unused
    s = { leads: [0], backs: [1] };
    const t = cycleMember(s, 1, "singles");
    expect(memberState(t, 1)).toBe("unused");
    expect(t.leads).toEqual([0]);
  });
});

describe("backCount", () => {
  it("counts leads and backs together", () => {
    expect(backCount({ leads: [0, 1], backs: [3] })).toBe(3);
  });
  it("returns 0 for empty selection", () => {
    expect(backCount(emptySelection)).toBe(0);
  });
});

describe("selectionToIndices / selectionFromIndices", () => {
  it("serializes leads before backs", () => {
    expect(selectionToIndices({ leads: [2, 0], backs: [4, 1] })).toEqual([2, 0, 4, 1]);
  });

  it("returns null for empty selection", () => {
    expect(selectionToIndices(emptySelection)).toBeNull();
  });

  it("round-trips through indices for doubles", () => {
    const selection: Selection = { leads: [2, 0], backs: [4, 1] };
    const restored = selectionFromIndices(selectionToIndices(selection), "doubles");
    expect(restored).toEqual(selection);
  });

  it("splits leadCount leads for singles", () => {
    expect(selectionFromIndices([3, 1, 5], "singles")).toEqual({ leads: [3], backs: [1, 5] });
  });

  it("returns empty for null indices", () => {
    expect(selectionFromIndices(null, "doubles")).toEqual(emptySelection);
  });
});

describe("cycleOpponentRole", () => {
  it("cycles null -> back -> lead -> null", () => {
    const counts = { back: 0, leads: 0 };
    expect(cycleOpponentRole(null, counts, "doubles")).toBe("back");
    expect(cycleOpponentRole("back", counts, "doubles")).toBe("lead");
    expect(cycleOpponentRole("lead", counts, "doubles")).toBeNull();
  });

  it("does not add beyond maxBack", () => {
    // doubles maxBack=4; 4 others already in the back
    expect(cycleOpponentRole(null, { back: 4, leads: 2 }, "doubles")).toBeNull();
  });

  it("removes from selection when leads are full instead of promoting", () => {
    // doubles leadCount=2; 2 others already lead
    expect(cycleOpponentRole("back", { back: 3, leads: 2 }, "doubles")).toBeNull();
  });
});
