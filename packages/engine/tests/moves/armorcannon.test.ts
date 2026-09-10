import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Armor Cannon (アーマーキャノン) drops user Def and SpD by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "armarouge", ability: "flashfire", moves: ["armorcannon"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move armorcannon 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
