import { test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

test("Move: After You (おさきにどうぞ) forces the target to move immediately after the user", () => {
  const env = new TestEnvironment(
    [
      // P1: Lopunny is fast (Choice Scarf), uses After You on its partner
      pokemon({
        species: "lopunny",
        ability: "cutecharm",
        moves: ["afteryou"],
        item: "choice-scarf",
      }),
      // P1: Pikachu is extremely slow and uses Thunderbolt
      pokemon({ species: "pikachu", ability: "static", item: "iron-ball", moves: ["thunderbolt"] }),
    ],
    [
      // P2: Opponent 1 is very fast, uses a fast move
      pokemon({ species: "gengar", ability: "cursedbody", moves: ["thunderbolt"] }),
      // P2: Opponent 2 is very fast, uses a priority move
      pokemon({ species: "arcanine", ability: "intimidate", moves: ["extremespeed"] }),
    ],
    {
      deterministicMoves: ["afteryou", "thunderbolt", "extremespeed"],
    },
  );

  // Turn Order Prediction:
  // 1. Opponent 2 (Arcanine) uses Extreme Speed (+2, Speed 300)
  // 2. Lopunny uses After You (+0, Speed 400) -> targets Pikachu (Speed 10)
  // 3. Pikachu uses Thunderbolt (+0, Speed 10) -> forced to move here!
  // 4. Opponent 1 (Gengar) uses Thunderbolt (+0, Speed 300)

  env.executeAndAssert(
    "move afteryou -2, move thunderbolt 1",
    "move thunderbolt 1, move extremespeed 1",
  );

  // No need to assert state beyond the logs matching, because the log order dictates the actual turn order!
  // `executeAndAssert` checks `assertEngineLogsMatchShowdown` which verifies that Pikachu moved BEFORE Ninjask!
});
