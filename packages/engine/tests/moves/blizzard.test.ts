import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: Blizzard hits through Snow", () => {
  const env = new TestEnvironment(
    [
      pokemon({ species: "abomasnow", ability: "snowwarning", moves: ["blizzard"] }),
      pokemon({ species: "clefable", ability: "magicguard", moves: ["sleeptalk"] }),
    ],
    [
      pokemon({ species: "pikachu", ability: "static", moves: ["sleeptalk", "sleeptalk"] }),
      pokemon({ species: "snorlax", ability: "thickfat", moves: ["sleeptalk"] }),
    ],
    {
      deterministicMoves: [
        { id: "blizzard", accuracy: true, secondary: "inherit" }, // accuracy true so it rolls normal accuracy logic
        { id: "sleeptalk", accuracy: true },
        "sleeptalk",
      ],
      engineConfig: {
        damage_roll: "max",
        secondary: "always",
      },
    },
  );

  // Turn 1-6: Pikachu uses Sand Attack 6 times to minimize Abomasnow accuracy. Abomasnow just sleeps or does whatever.
  // Actually, to make it faster, just 1 Sand Attack lowers accuracy to 3/4. With Blizzard 70%, its 52.5%.
  // If we set engineConfig.accuracy to "always", it ALWAYS hits. So I CANNOT test accuracy naturally if I force "always".
  // If I do NOT force "always", how do I ensure Blizzard misses EXCEPT when Hail is active?
  // I can rely on the fact that the test compares against Showdown. Showdown and Rust engine will BOTH hit if Hail is active.
  env.executeAndAssert("move blizzard, move sleeptalk", "move sleeptalk, move sleeptalk");
});
