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

  env.executeAndAssert("move snowscape, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: snowscape boosts Ice-type physical defense", () => {
  const env = new TestEnvironment(
    [
      pokemon({
        species: "alolan-ninetales",
        moves: ["snowscape"],
        nature: "Timid",
        evs: { spe: 32 },
      }),
      pokemon({ species: "pikachu", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["bodyslam", "sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move snowscape, move sleeptalk", "move bodyslam 1, move sleeptalk");
});
