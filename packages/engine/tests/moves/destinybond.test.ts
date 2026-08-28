import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Destiny Bond", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gengar", moves: ["destinybond", "sleeptalk"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", evs: { atk: 32 }, moves: ["crunch", "bellydrum"] }),
      pokemon({ species: "raichu", evs: { spa: 32 }, moves: ["thunderbolt", "sleeptalk"] }),
    ],
  );

  // Turn 1: Snorlax uses Belly Drum, Gengar uses Sleep Talk.
  env.executeTurn("move sleeptalk, move sleeptalk", "move bellydrum, move sleeptalk");
  // Turn 2: Snorlax uses Crunch, Gengar uses Destiny Bond.
  const res = env.executeTurn("move destinybond, move sleeptalk", "move crunch 1, move sleeptalk");
  env.assertStateMatch(res.engineState, env.sim);
});
