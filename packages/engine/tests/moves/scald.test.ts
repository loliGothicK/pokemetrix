import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: scald", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "slowbro-mega", moves: ["scald"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move scald 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
