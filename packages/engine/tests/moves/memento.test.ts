import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: memento", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ninetales", moves: ["memento"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  const logs = env.executeTurn("move memento 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
