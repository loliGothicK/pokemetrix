import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aromatic Mist raises adjacent ally SpD by 1", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "aromatisse", ability: "healer", moves: ["aromaticmist"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move aromaticmist -2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
