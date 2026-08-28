import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Ability: Intimidate (いかく) lowers opponents' Attack by 1 stage on switch-in, blocked by Clear Body", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "lightning-rod", moves: ["sleeptalk"] }),
      pokemon({ species: "metagross", ability: "clear-body", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Everyone just uses Sleep Talk, we assert the state which checks boosts.
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});
