import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Dire Claw", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "sneasler", moves: ["direclaw"] }),
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      pokemon({ species: "raichu", moves: ["sleeptalk"] }),
    ],
    {
      engineConfig: { secondary: "always" },
    },
  );

  const res = env.executeTurn("move direclaw 1, move sleeptalk", "move sleeptalk, move sleeptalk");

  const clefable = res.engineState.p2.active[0];
  expect(clefable.hp).toBeLessThan(170); // took damage
  expect(clefable.status).toBeDefined(); // got a status
  expect(["psn", "par", "slp"]).toContain(clefable.status);
});
