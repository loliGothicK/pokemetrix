import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";
test("Move: Magnetic Flux", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "ampharos", ability: "plus", moves: ["magneticflux"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move magneticflux, move sleeptalk", "move sleeptalk, move sleeptalk");
});
