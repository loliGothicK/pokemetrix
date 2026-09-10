import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Belly Drum cuts HP by half and maximizes Attack", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bellydrum"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  env.executeAndAssert("move bellydrum, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Belly Drum fails if HP is less than or equal to half", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bellydrum"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
  );

  // Turn 1: Belly Drum cuts HP in half.
  env.executeAndAssert("move bellydrum, move sleeptalk", "move sleeptalk, move sleeptalk");
  // Turn 2: HP is now exactly half. Belly Drum should fail.
  env.executeAndAssert("move bellydrum, move sleeptalk", "move sleeptalk, move sleeptalk");
});

test("Move: Belly Drum fails if Attack is already +6", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["bellydrum", "curse"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: ["bellydrum", "curse", "sleeptalk"],
    },
  );

  // Turn 1, 2, 3: Swords Dance to reach +6 Attack.
  env.executeAndAssert("move curse, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move curse, move sleeptalk", "move sleeptalk, move sleeptalk");
  env.executeAndAssert("move curse, move sleeptalk", "move sleeptalk, move sleeptalk");

  // Turn 4: Attack is +6, HP is full. Belly Drum should fail.
  env.executeAndAssert("move bellydrum, move sleeptalk", "move sleeptalk, move sleeptalk");
});
