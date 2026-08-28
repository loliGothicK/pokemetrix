import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Last Respects", () => {
  const attacker = pokemon({ species: "gengar", moves: ["sleeptalk"] });
  // The Champions data set contains Basculegion, but the installed Showdown
  // mod does not. Keep the simulator species valid while exercising the move.
  attacker.moves = ["lastrespects"];
  const env = new TestEnvironment(
    [attacker, pokemon({ species: "snorlax", moves: ["sleeptalk"] })],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move lastrespects 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
