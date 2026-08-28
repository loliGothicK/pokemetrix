import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Guard Swap", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alakazam", moves: ["guardswap"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move guardswap 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
