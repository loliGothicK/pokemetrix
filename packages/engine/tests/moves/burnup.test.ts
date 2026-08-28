import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("Move: Burn Up", () => {
  test("Burn Up removes Fire typing from the user", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "typhlosion", moves: ["burnup", "sleeptalk"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
        pokemon({ species: "raichu", moves: ["sleeptalk"] }),
      ],
    );

    // We can execute a turn and look at the logs to observe Burn Up
    env.executeTurn("move burnup 1, move sleeptalk", "move sleeptalk, move sleeptalk");
    console.log("TYPES AFTER BURNUP:", env.sim.p1.active[0].types);
  });
});
