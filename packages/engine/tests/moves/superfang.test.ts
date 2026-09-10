import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Move: Super Fang (いかりのまえば)", () => {
  test("Deals damage equal to half of target's current HP", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "houndoom", moves: ["superfang", "sleeptalk"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["superfang", "sleeptalk"],
      },
    );

    env.executeAndAssert("move superfang 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  test("Is immune against Ghost-type", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "houndoom", moves: ["superfang", "sleeptalk"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["superfang", "sleeptalk"],
      },
    );

    // Target Gengar (slot 2) which is Ghost-type (immune to Normal-type Super Fang)
    env.executeAndAssert("move superfang 2, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
