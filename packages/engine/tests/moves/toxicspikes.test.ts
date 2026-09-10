import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Toxic Spikes", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["toxicspikes"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", moves: ["sleeptalk"] }),
    ],
  );
  env.executeAndAssert("move toxicspikes, move sleeptalk", "move sleeptalk, move sleeptalk");
});
