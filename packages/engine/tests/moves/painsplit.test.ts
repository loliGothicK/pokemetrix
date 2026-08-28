import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: painsplit", () => {
  it("should average HP", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "gengar", moves: ["painsplit", "curse"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );

    // Gengar uses Curse and loses 50% HP
    env.executeTurn("move curse 1, move sleeptalk", "move sleeptalk, move sleeptalk");

    // Gengar (50%) uses Pain Split on Snorlax (100%)
    env.executeAndAssert("move painsplit 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
