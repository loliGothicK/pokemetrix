import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: minimize", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "starmie-mega", moves: ["minimize"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move minimize, move sleeptalk", "move sleeptalk, move sleeptalk");
});
