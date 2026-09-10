import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: King's Shield", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "aegislash-shield", moves: ["kingsshield"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move kingsshield, move sleeptalk", "move sleeptalk, move sleeptalk");
});
