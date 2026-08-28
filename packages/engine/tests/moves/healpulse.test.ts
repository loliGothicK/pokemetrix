import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: healpulse", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["healpulse"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move healpulse 2, move sleeptalk", "move sleeptalk, move sleeptalk");
});
