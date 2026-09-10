import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: hypnosis", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-ninetales", moves: ["hypnosis"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["acrobatics"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move hypnosis 1, move sleeptalk", "move acrobatics 1, move sleeptalk");
});
