import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Smack Down", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["smackdown"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move smackdown 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
