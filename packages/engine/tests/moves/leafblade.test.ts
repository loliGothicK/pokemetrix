import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Leaf Blade", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "victreebel-mega", moves: ["leafblade"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move leafblade 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
