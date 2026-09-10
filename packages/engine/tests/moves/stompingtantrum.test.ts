import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Stomping Tantrum deals damage", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "garchomp", ability: "roughskin", moves: ["stompingtantrum"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "tauros", ability: "intimidate", moves: ["sleeptalk"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move stompingtantrum 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
