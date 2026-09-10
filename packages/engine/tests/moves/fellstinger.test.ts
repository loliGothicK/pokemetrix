import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Fell Stinger", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["fellstinger"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", hp: 1, moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move fellstinger 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
