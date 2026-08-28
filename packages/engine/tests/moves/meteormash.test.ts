import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Meteor Mash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["meteormash"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move meteormash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
