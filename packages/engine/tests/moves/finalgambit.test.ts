import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Final Gambit", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "staraptor", ability: "reckless", moves: ["finalgambit"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move finalgambit 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Final Gambit Hit", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "staraptor", ability: "reckless", moves: ["finalgambit"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move finalgambit 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
