import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Role Play", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alakazam", ability: "synchronize", moves: ["roleplay"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "sheerforce", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move roleplay 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
