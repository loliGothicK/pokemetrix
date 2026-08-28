import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Focus Sash", () => {
  it("allows holder to survive an attack that would KO with 1 HP when at full HP", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "pikachu",
          item: "focussash",
          moves: ["sleeptalk"],
        }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({
          species: "garchomp",
          moves: ["earthquake", "sleeptalk"],
        }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Garchomp uses Earthquake which would easily OHKO Pikachu.
    // Focus Sash activates, Pikachu survives with 1 HP, and item is consumed.
    env.executeAndAssert("move sleeptalk, move sleeptalk", "move earthquake, move sleeptalk");
  });
});
