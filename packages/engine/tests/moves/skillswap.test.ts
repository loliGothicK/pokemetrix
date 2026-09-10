import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Skill Swap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-raichu", ability: "surgesurfer", moves: ["skillswap"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "sheerforce", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move skillswap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
