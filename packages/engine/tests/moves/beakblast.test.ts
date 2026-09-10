import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Beak Blast (くちばしキャノン) charges at start of turn and burns contact attackers", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "toucannon", item: "focussash", moves: ["beakblast"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["doubleedge"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move beakblast 1, move sleeptalk", "move doubleedge 1, move sleeptalk");
});
