import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Volt Tackle deals damage with recoil", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["volttackle"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move volttackle 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
