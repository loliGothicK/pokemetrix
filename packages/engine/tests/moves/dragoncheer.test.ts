import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Dragon Cheer (Non-Dragon)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["dragoncheer"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }), // Non-Dragon
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  // Charizard uses Dragon Cheer on ally Snorlax (ally is negative slot in showdown, or slot -2)
  // Actually, target adjacent ally is automatic for Dragon Cheer in Showdown!

  const res1 = env.executeTurn(
    "move dragoncheer -2, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );
  expect(res1.engineState.p1.active[1].volatile_status).toContain("dragoncheer");

  // Use Dragon Cheer again (should fail)
  const res2 = env.executeTurn(
    "move dragoncheer -2, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );

  expect(res2.engineLogs).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ event: expect.objectContaining({ type: "Fail" }) }),
    ]),
  );
});

test("Move: Dragon Cheer (Dragon)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", moves: ["dragoncheer"] }),
      pokemon({ species: "dragonite", moves: ["sleeptalk"] }), // Dragon
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  const res3 = env.executeTurn(
    "move dragoncheer -2, move sleeptalk",
    "move sleeptalk, move sleeptalk",
  );

  expect(res3.engineState.p1.active[1].volatile_status).toContain("dragoncheer");
});
