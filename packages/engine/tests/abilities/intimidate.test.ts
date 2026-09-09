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

test("Ability: Intimidate is blocked by Oblivious and Own Tempo", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "slowbro", ability: "oblivious", moves: ["sleeptalk"] }),
      pokemon({ species: "slowking", ability: "own-tempo", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Ability: Intimidate is blocked by Inner Focus and Scrappy", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "dragonite", ability: "inner-focus", moves: ["sleeptalk"] }),
      pokemon({ species: "kangaskhan", ability: "scrappy", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move sleeptalk, move sleeptalk", "move sleeptalk, move sleeptalk");
});
