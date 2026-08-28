import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Population Bomb", () => {
  const attacker = pokemon({ species: "gengar", moves: ["sleeptalk"] });
  attacker.moves = ["populationbomb"];
  const env = new TestEnvironment(
    [attacker, pokemon({ species: "snorlax", moves: ["sleeptalk"] })],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move populationbomb 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
