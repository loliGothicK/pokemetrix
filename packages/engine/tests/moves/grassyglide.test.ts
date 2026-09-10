import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Grassy Glide", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "venusaur-mega", moves: ["grassyglide"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move grassyglide 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
