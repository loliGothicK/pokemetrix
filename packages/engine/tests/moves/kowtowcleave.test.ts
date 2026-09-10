import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: kowtowcleave", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kingambit", moves: ["kowtowcleave"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move kowtowcleave 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
