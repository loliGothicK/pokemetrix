import { expect, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Knok Off should be kock off even if user fainted by roughskin", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", item: "choicescarf", moves: ["earthquake"] }),
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blaziken", ability: "speedboost", item: "focussash", moves: ["knockoff"] }),
      pokemon({ species: "aerodactyl", ability: "unnerve", moves: ["dualwingbeat"] }),
    ],
  );
  const { engineState } = env.executeAndAssert(
    "move earthquake, move sleeptalk",
    "move knockoff 1, move dualwingbeat 1",
  )!;
  expect(engineState.p1.active[0].item).toBeFalsy();
});
