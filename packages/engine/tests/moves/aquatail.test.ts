import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aqua Tail (アクアテール) deals standard physical damage with contact", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gyarados", ability: "intimidate", moves: ["aquatail", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "lightning-rod", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thick-fat", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Gyarados uses Aqua Tail on Snorlax
  env.executeAndAssert("move aquatail 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
