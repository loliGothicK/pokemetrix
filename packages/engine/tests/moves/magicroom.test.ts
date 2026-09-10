import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Magic Room", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-raichu", moves: ["magicroom"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move magicroom, move sleeptalk", "move sleeptalk, move sleeptalk");
});
