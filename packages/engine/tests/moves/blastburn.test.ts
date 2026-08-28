import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Blast Burn", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "charizard", ability: "blaze", moves: ["blastburn"] }),
      pokemon({ species: "pidgeot", ability: "keeneye", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [{ id: "blastburn", accuracy: true }, "sleeptalk"],
      engineConfig: { accuracy: "always", damage_roll: "max", secondary: "always" },
    },
  );

  env.executeAndAssert("move blastburn 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  try {
    env.executeAndAssert("move recharge 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  } catch (e) {
    console.log(env.sim.log.join("\n"));
    throw e;
  }
});
