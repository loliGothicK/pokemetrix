import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Move: Axe Kick (かかとおとし)", () => {
  test("Crash damage when immune", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "medicham", ability: "purepower", moves: ["axekick"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
        pokemon({ species: "snorlax", ability: "immunity", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move axekick 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  test("Crash damage when protected", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "medicham", ability: "purepower", moves: ["axekick"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", ability: "immunity", moves: ["protect"] }),
        pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      ],
    );

    env.executeAndAssert("move axekick 1, move sleeptalk", "move protect, move sleeptalk");
  });

  test("Secondary effect causes confusion", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "medicham", ability: "purepower", moves: ["axekick"] }),
        pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", ability: "immunity", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      ],
      {
        deterministicMoves: [{ id: "axekick", secondary: "inherit" }, "sleeptalk"],
      },
    );

    env.executeAndAssert("move axekick 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
      secondary: "always",
    });
  });
});
