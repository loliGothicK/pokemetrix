import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Move: Supercell Slam (サンダーダイブ)", () => {
  test("Hits target successfully", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "ampharos", moves: ["supercellslam"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
        pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["supercellslam", "sleeptalk"],
      },
    );

    env.executeAndAssert("move supercellslam 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  test("Crash damage when protected", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "ampharos", moves: ["supercellslam"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", moves: ["protect"] }),
        pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["supercellslam", "sleeptalk", "protect"],
      },
    );

    env.executeAndAssert("move supercellslam 1, move sleeptalk", "move protect, move sleeptalk");
  });

  test("Crash damage when immune (Ground-type)", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "ampharos", moves: ["supercellslam"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "blastoise", moves: ["sleeptalk"] }),
        pokemon({ species: "garchomp", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: ["supercellslam", "sleeptalk"],
      },
    );

    // Target garchomp (slot 2) which is Ground-type (immune to Electric)
    env.executeAndAssert("move supercellslam 2, move sleeptalk", "move sleeptalk, move sleeptalk");
  });
});
