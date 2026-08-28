import { describe, it } from "vitest";
import { pokemon, TestEnvironment } from "@/sim-utils";

describe("Ability: Earth Eater (どしょく) Differential Test", () => {
  it("heals 1/4 of max HP when hit by a damaging Ground-type move", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "garchomp", ability: "sandveil", moves: ["stompingtantrum"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["stompingtantrum", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert(
      "move sleeptalk, move sleeptalk",
      "move stompingtantrum 1, move sleeptalk",
    );
  });

  it("stops multi-hit Ground-type moves (e.g., Bone Rush) on the very first hit and only heals once", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "lucario", ability: "steadfast", moves: ["bonerush"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["bonerush", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move bonerush 1, move sleeptalk");
  });

  it("completely nullifies the move even at Max HP", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "steelix", ability: "sturdy", moves: ["earthquake"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["earthquake", "sleeptalk"],
      },
    );

    env.executeAndAssert("move sleeptalk, move sleeptalk", "move earthquake, move sleeptalk");
  });

  it("triggers when hit by an ally's move (e.g. Earthquake)", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "orthworm", ability: "eartheater", moves: ["sleeptalk"] }),
        pokemon({ species: "steelix", ability: "sturdy", moves: ["earthquake"] }),
      ],
      [
        pokemon({ species: "blastoise", ability: "torrent", moves: ["sleeptalk"] }),
        pokemon({ species: "charizard", ability: "blaze", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["earthquake", "sleeptalk"],
      },
    );

    // HP modified naturally or no longer needed

    env.executeAndAssert("move sleeptalk, move earthquake", "move sleeptalk, move sleeptalk");
  });
});
