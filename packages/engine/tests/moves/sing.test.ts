import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: sing", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "clefable", moves: ["sing"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "machamp", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move sing 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
