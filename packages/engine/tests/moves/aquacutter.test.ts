import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Aqua Cutter (アクアカッター) receives 1.5x boost from Sharpness", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gallade", ability: "sharpness", moves: ["aquacutter"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move aquacutter 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Aqua Cutter (アクアカッター) is not boosted by generic abilities", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "gallade", ability: "steadfast", moves: ["aquacutter"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move aquacutter 1, move sleeptalk", "move sleeptalk, move sleeptalk");
});
