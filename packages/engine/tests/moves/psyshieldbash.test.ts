import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Psyshield Bash", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "wyrdeer", moves: ["psyshieldbash"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move psyshieldbash 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
