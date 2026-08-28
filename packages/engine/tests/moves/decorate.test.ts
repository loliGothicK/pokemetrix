import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Decorate", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alcremie", ability: "sweetveil", moves: ["decorate"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move decorate -2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
