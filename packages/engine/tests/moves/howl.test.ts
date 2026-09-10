import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: howl", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-ninetales", moves: ["howl"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move howl, move sleeptalk", "move sleeptalk, move sleeptalk");
});
