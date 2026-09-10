import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rising Voltage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "pikachu", moves: ["risingvoltage"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move risingvoltage 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
