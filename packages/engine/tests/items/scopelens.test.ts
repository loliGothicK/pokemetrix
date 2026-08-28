import { describe, it } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Item: Scope Lens", () => {
  it("boosts critical hit stage by 1, guaranteeing a crit when combined with Focus Energy", () => {
    const env = new TestEnvironment(
      [
        pokemon({
          species: "beedrill",
          item: "scopelens",
          moves: ["focusenergy", "poisonjab", "sleeptalk"],
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
      {
        deterministicMoves: [
          { id: "focusenergy", damage_roll: "max" },
          { id: "poisonjab", damage_roll: "max" },
          "sleeptalk",
        ],
      },
    );

    // Turn 1: Beedrill uses Focus Energy (+2 crit stage). Scope Lens provides +1 crit stage.
    env.executeAndAssert("move focusenergy, move sleeptalk", "move sleeptalk, move sleeptalk");

    // Turn 2: Beedrill attacks Snorlax with Poison Jab. With +3 crit stages, it crits.
    env.executeAndAssert("move poisonjab 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      crits: "always",
    });
  });
});
