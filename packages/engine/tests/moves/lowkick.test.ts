import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: lowkick", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "machamp", moves: ["lowkick"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move lowkick 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
