import { describe, test } from "vitest";
import { TestEnvironment, pokemon } from "@/sim-utils";

describe("move: dragondarts", () => {
  test("Normal: Hits both opponents", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  test("Fairy: Target's ally is Fairy, hits target twice", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  test("Fairy: Target is Fairy, hits target's ally twice", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "clefable", moves: ["sleeptalk"] }),
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move sleeptalk, move sleeptalk");
  });

  test("Protect: Target uses Protect, hits target's ally twice", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "charizard", moves: ["protect", "sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["sleeptalk"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move protect, move sleeptalk");
  });

  test("Protect: Target's ally uses Protect, hits target twice", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["protect", "sleeptalk"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move sleeptalk, move protect");
  });

  test("Both Protect: Target and ally use Protect, fails", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "charizard", moves: ["protect", "sleeptalk"] }),
        pokemon({ species: "gengar", moves: ["protect", "sleeptalk"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move protect, move protect");
  });

  test("Follow Me/Rage Powder: Hits redirector twice", () => {
    const env = new TestEnvironment(
      [
        pokemon({ species: "dragapult", moves: ["dragondarts"] }),
        pokemon({ species: "snorlax", moves: ["sleeptalk"] }),
      ],
      [
        pokemon({ species: "charizard", moves: ["sleeptalk"] }),
        pokemon({ species: "clefable", moves: ["followme"] }),
      ],
    );
    env.executeAndAssert("move dragondarts 1, move sleeptalk", "move sleeptalk, move followme");
  });
});
