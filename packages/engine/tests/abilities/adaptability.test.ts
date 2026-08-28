import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Adaptability (てきおうりょく) Differential Test", () => {
  it("increases STAB modifier from 1.5x to 2x (STAB move)", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "lucario-mega", ability: "adaptability", moves: ["closecombat"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["closecombat", "sleeptalk"],
      },
    );

    env.executeAndAssert("move closecombat 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  it("does not increase modifier for non-STAB move", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "lucario-mega", ability: "adaptability", moves: ["bite"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "umbreon", ability: "synchronize", moves: ["sleeptalk"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["bite", "sleeptalk"],
      },
    );

    env.executeAndAssert("move bite 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
