import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Psychic", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-raichu", moves: ["psychic"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move psychic 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
