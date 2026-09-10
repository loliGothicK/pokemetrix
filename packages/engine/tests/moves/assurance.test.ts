import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Assurance power doubles if target took damage this turn", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "umbreon", ability: "innerfocus", moves: ["assurance", "protect"] }),
      pokemon({ species: "pikachu", ability: "lightningrod", moves: ["quickattack", "protect"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move assurance 1, move quickattack 1", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move assurance 2, move protect", "move sleeptalk, move sleeptalk");
});
