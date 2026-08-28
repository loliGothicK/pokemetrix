import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Coaching", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "lucario", ability: "innerfocus", moves: ["coaching"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move coaching -2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
