import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Extrasensory", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ninetales", moves: ["extrasensory"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "slowbro", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
    { deterministicMoves: [{ id: "extrasensory", secondary: "always" }] },
  );

  env.executeAndAssert("move extrasensory 1, move sleeptalk", "move sleeptalk, move sleeptalk", {
    secondary: "always",
  });
});
