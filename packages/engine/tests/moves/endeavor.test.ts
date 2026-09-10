import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Endeavor (Success)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["endeavor"], hp: 10 }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move endeavor 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Endeavor (Fail)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["endeavor"] }), // full HP
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"], hp: 10 }), // low HP
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move endeavor 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Endeavor (Ghost Immunity)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["endeavor"], hp: 10 }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    { engineConfig: { damage_roll: "max" } },
  );

  env.executeAndAssert("move endeavor 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
