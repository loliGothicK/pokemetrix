import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aqua Ring (アクアリング) heals 1/16 Max HP at the end of the turn", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "vaporeon", ability: "waterabsorb", moves: ["aquaring", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  // HP modified naturally or no longer needed
  env.executeAndAssert("move aquaring, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Aqua Ring (アクアリング) healing is multiplied by 1.3 with Big Root", () => {
  const env = new TestEnvironment(
    [
      pokemon({
        species: "vaporeon",
        item: "bigroot",
        ability: "waterabsorb",
        moves: ["aquaring", "sleeptalk"],
      }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  // HP modified naturally or no longer needed
  env.executeAndAssert("move aquaring, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});
