import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aura Sphere ignores accuracy and evasion checks", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", moves: ["aurasphere", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "starmie", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Aura Sphere hits despite accuracy forced to "never"
  const res = env.executeTurn(
    "move aurasphere 1, move sleeptalk",
    "move sleeptalk, move sleeptalk",
    { damage_roll: "max", accuracy: "never", crits: "never" },
  );
  env.assertStateMatch(res.engineState, env.sim);
});
