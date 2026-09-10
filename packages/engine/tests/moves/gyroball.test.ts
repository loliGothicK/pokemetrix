import { test } from "vitest";
import { TestEnvironment } from "@/sim-utils";
import { pokemon } from "@/sim-utils";

test("Move: Gyro Ball", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "blastoise", moves: ["gyroball"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move gyroball 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
