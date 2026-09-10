import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Electro Shot", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "archaludon", moves: ["electroshot"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move electroshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move electroshot 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Electro Shot (Rain)", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "archaludon", moves: ["electroshot"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk", "raindance"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  // Use executeTurn to avoid log matching issues with prepare
  env.executeTurn("move electroshot 1, move sleeptalk", "move raindance, move sleeptalk");
});
