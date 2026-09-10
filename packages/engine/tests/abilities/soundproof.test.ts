import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Soundproof (ぼうおん) Differential Test", () => {
  it("blocks damage and effects from sound-based moves", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "volcarona", ability: "flamebody", moves: ["bugbuzz"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "kommo-o", ability: "soundproof", moves: ["sleeptalk"] }),
        pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["bugbuzz", "sleeptalk"],
      },
    );

    env.executeAndAssert("move bugbuzz 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  it("blocks Parting Shot (すてゼリフ) from lowering stats and switching", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "incineroar", ability: "blaze", moves: ["partingshot"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "kommo-o", ability: "soundproof", moves: ["sleeptalk"] }),
        pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["partingshot", "sleeptalk"],
      },
    );

    env.executeAndAssert("move partingshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
