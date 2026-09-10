import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rage Fist", () => {
  const attacker = pokemon({ species: "gengar", moves: ["sleeptalk"] });
  attacker.moves = ["ragefist"];
  const env = new TestEnvironment(
    [attacker, pokemon({ species: "snorlax", moves: ["sleeptalk"] })],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move ragefist 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
