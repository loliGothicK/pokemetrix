import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Clangorous Soul", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "kommoo", ability: "bulletproof", moves: ["clangoroussoul"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move clangoroussoul, move sleeptalk", "move sleeptalk, move sleeptalk");
});
