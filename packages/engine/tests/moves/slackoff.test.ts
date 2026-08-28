import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Slack Off", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "galarian-slowbro", moves: ["slackoff"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move slackoff, move sleeptalk", "move sleeptalk, move sleeptalk");
});
