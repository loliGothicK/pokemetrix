import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Ancient Power (げんしのちから) raises all stats by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "aerodactyl", ability: "pressure", moves: ["ancientpower"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "ancientpower", secondary: "inherit" }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );

  env.executeAndAssert("move ancientpower 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
    secondary: "always",
  });

  const aero = env.sim.p1.pokemon[0];
  expect(aero.boosts.atk).toBe(1);
  expect(aero.boosts.def).toBe(1);
  expect(aero.boosts.spa).toBe(1);
  expect(aero.boosts.spd).toBe(1);
  expect(aero.boosts.spe).toBe(1);

  // It shouldn't boost accuracy or evasion
  expect(aero.boosts.accuracy).toBe(0);
  expect(aero.boosts.evasion).toBe(0);
});
