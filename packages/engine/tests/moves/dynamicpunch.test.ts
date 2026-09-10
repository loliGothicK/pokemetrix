import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Dynamic Punch confuses the target", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "machamp", moves: ["dynamicpunch"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "dynamicpunch", secondary: "inherit" }, "sleeptalk"],
      engineConfig: { secondary: "always" },
    },
  );

  env.executeAndAssert("move dynamicpunch 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
