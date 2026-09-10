import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Seismic Toss", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "machamp", moves: ["seismictoss"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move seismictoss 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
