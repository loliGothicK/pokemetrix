import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Hard Press", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pinsir-mega", moves: ["hardpress"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move hardpress 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
