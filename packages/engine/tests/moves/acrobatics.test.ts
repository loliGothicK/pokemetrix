import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Acrobatics (アクロバット) power is doubled when holding no item", () => {
  const envNoItem = new TestEnvironment(
    [
      pokemon({ species: "talonflame", ability: "flamebody", item: "", moves: ["acrobatics"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "umbreon", ability: "synchronize", item: "", moves: ["sleeptalk"] }),
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["acrobatics", "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never" },
    },
  );
  envNoItem.executeAndAssert("move acrobatics 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const envItem = new TestEnvironment(
    [
      pokemon({
        species: "talonflame",
        ability: "flamebody",
        item: "leftovers",
        moves: ["acrobatics"],
      }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "umbreon", ability: "synchronize", item: "", moves: ["sleeptalk"] }),
      pokemon({ species: "sylveon", ability: "pixilate", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["acrobatics", "sleeptalk"],
      engineConfig: { damage_roll: "max", crits: "never" },
    },
  );

  envItem.executeAndAssert("move acrobatics 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const noItemDmg =
    envNoItem.engine.get_state().p2.active[0].maxhp - envNoItem.engine.get_state().p2.active[0].hp;
  const itemDmg =
    envItem.engine.get_state().p2.active[0].maxhp - envItem.engine.get_state().p2.active[0].hp;

  if (noItemDmg <= itemDmg) {
    throw new Error(
      `Expected no-item damage (${noItemDmg}) to be greater than item damage (${itemDmg}).`,
    );
  }
});
