import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Milk Drink heals an ally in double battles", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gogoat", ability: "sapsipper", moves: ["milkdrink", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"], hp: 100 }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["milkdrink", "sleeptalk"],
    },
  );
  env.executeAndAssert("move milkdrink -2, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Milk Drink fails if target ally is at full HP", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gogoat", ability: "sapsipper", moves: ["milkdrink", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "unaware", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["milkdrink", "sleeptalk"],
    },
  );
  env.executeAndAssert("move milkdrink -2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
