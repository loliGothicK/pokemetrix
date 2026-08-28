import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Life Orb", () => {
  it("boosts damage by 1.3x and inflicts 10% max HP recoil on damaging moves", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "lifeorb",
          moves: ["quickattack"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "snorlax",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move quickattack 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
