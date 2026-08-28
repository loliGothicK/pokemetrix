import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Barb Barrage (どくばりセンボン) doubles power against poisoned target", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "overqwil", ability: "intimidate", moves: ["barbbarrage", "toxic"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Hit Snorlax with Toxic.
  env.executeAndAssert("move toxic 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const snorlax2 = env.sim.p2.pokemon[0];
  expect(snorlax2.status).toBe("tox");

  // Turn 2: Hit Snorlax with Barb Barrage. It is badly poisoned, so power is 120.
  env.executeAndAssert("move barbbarrage 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
