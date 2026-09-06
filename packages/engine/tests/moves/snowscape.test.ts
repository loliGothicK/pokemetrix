import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: snowscape", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "alolan-ninetales", moves: ["snowscape"] }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  const logs = env.executeTurn("move snowscape, move sleeptalk", "move sleeptalk, move sleeptalk");
});
