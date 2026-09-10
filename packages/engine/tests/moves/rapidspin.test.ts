import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Rapid Spin removes the user's side hazards", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "beedrill", moves: ["toxicspikes", "sleeptalk"] }),
      pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "blastoise", moves: ["rapidspin", "sleeptalk"] }),
      pokemon({ species: "tauros", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move toxicspikes, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move sleeptalk, move sleeptalk", "move rapidspin 1, move sleeptalk");
});
