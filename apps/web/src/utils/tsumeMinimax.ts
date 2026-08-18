import { TsumeEngine } from "./tsumeEngine";
import type { TsumeData } from "@/types/quiz";

// Recursively builds the Cartesian product of an array of arrays
function cartesianProduct<T>(arr: T[][]): T[][] {
  return arr.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]] as T[][]);
}

function filterValidCombinations(combinations: string[][], activeReq: any): string[] {
  const validCombinations = combinations.filter((combo) => {
    // 1. Multiple megas are not allowed
    const megas = combo.filter((c) => c.includes("mega")).length;
    if (megas > 1) return false;

    // 2. Duplicate switches (e.g. switching the same Pokemon into 2 different slots)
    const switches = combo.filter((c) => c.startsWith("switch"));
    const uniqueSwitches = new Set(switches);
    if (uniqueSwitches.size !== switches.length) return false;

    // 3. For forced switches, you MUST fill slots if you have bench pokemon
    if (activeReq && activeReq.forceSwitch) {
      // The combination length is the same as forceSwitch array length
      // Find how many forced switches we actually NEED to fill
      // const numForcedSwitches = activeReq.forceSwitch.filter((b: boolean) => b).length;
      // If we filled fewer slots than we need to, we must check if we ran out of bench pokemon.
      // The uniqueSwitches we generated earlier tells us how many bench pokemon we used.
      // We cannot use more than we have, but if we used LESS than `numForcedSwitches`
      // AND there were still more bench pokemon available (which we know if `choicesForThisSlot` had other switches),
      // it means we picked `pass` when we could have picked `switch`.
      // The easiest way is: we want the combinations that have the MAXIMUM possible filledSlots!
      // We can't do that purely in `filter` since we don't know the max.
      // Wait, we know `numForcedSwitches`.
      // We also know how many unique switches were available across all slots.
      // Let's just reject any combination that has a `pass` for a slot that `needsSwitch`
      // UNLESS we have literally used up all available switches in other slots.
    }

    return true;
  });

  const mapped = validCombinations.map((c) => c.join(","));

  // Post-process to only keep the combinations that have the maximum number of choices.
  // We want to maximize the number of REAL choices (non-pass)
  if (activeReq && activeReq.forceSwitch) {
    let maxChoices = -1;
    const countChoices = (c: string[]) => c.filter((choice) => choice !== "pass").length;

    // Calculate max real choices
    validCombinations.forEach((c) => {
      maxChoices = Math.max(maxChoices, countChoices(c));
    });

    // Return only those that maximize real choices, joined with commas
    return validCombinations.filter((c) => countChoices(c) === maxChoices).map((c) => c.join(","));
  }
  return mapped;
}

function getMovePriority(choice: string): number {
  if (!choice || typeof choice !== "string") return 0;
  if (choice === "pass") return 0;
  if (choice.startsWith("switch")) return 1;
  let priority = 10;
  if (choice.includes("mega")) priority += 5;
  return priority;
}

export function getValidChoicesForSide(sideObj: any): string[] {
  const req = sideObj.activeRequest;
  if (!req) return ["pass"];

  const slotChoices: string[][] = [];

  if (req.forceSwitch) {
    req.forceSwitch.forEach((needsSwitch: boolean) => {
      const choicesForThisSlot: string[] = [];
      if (needsSwitch) {
        sideObj.pokemon.forEach((mon: any, i: number) => {
          if (i >= req.forceSwitch.length && mon.hp > 0 && !mon.fainted) {
            choicesForThisSlot.push(`switch ${i + 1}`);
          }
        });
        // Important: Always allow pass in forceSwitch to handle "not enough bench" scenarios
        choicesForThisSlot.push("pass");
      } else {
        choicesForThisSlot.push("pass");
      }
      slotChoices.push(choicesForThisSlot.length > 0 ? choicesForThisSlot : ["pass"]);
    });
  } else if (req.active) {
    req.active.forEach((activeMon: any, activeIdx: number) => {
      const choicesForThisSlot: string[] = [];

      if (
        !sideObj.active[activeIdx] ||
        sideObj.active[activeIdx].hp <= 0 ||
        sideObj.active[activeIdx].fainted
      ) {
        choicesForThisSlot.push("pass");
        slotChoices.push(choicesForThisSlot);
        return;
      }

      activeMon.moves.forEach((move: any, moveIdx: number) => {
        if (!move.disabled) {
          const moveId = moveIdx + 1;
          const variants: string[] = [`move ${moveId}`];
          if (activeMon.canMegaEvo) {
            variants.push(`move ${moveId} mega`);
          }

          variants.forEach((v) => {
            if (move.target === "normal" || move.target === "any") {
              if (sideObj.active.length > 1) {
                // Check if target is actually alive
                const target1 = sideObj.foe.active[0];
                const target2 = sideObj.foe.active[1];
                const ally = sideObj.active[activeIdx === 0 ? 1 : 0];

                if (target1 && target1.hp > 0 && !target1.fainted)
                  choicesForThisSlot.push(`${v} 1`);
                if (target2 && target2.hp > 0 && !target2.fainted)
                  choicesForThisSlot.push(`${v} 2`);
                if (ally && ally.hp > 0 && !ally.fainted)
                  choicesForThisSlot.push(`${v} -${activeIdx === 0 ? 2 : 1}`);
              } else {
                choicesForThisSlot.push(v);
              }
            } else {
              choicesForThisSlot.push(v);
            }
          });
        }
      });

      if (req.forceSwitch || !req.noSwitch) {
        sideObj.pokemon.forEach((mon: any, i: number) => {
          if (i >= sideObj.active.length && mon.hp > 0 && !mon.fainted) {
            choicesForThisSlot.push(`switch ${i + 1}`);
          }
        });
      }

      slotChoices.push(choicesForThisSlot.length > 0 ? choicesForThisSlot : ["pass"]);
    });
  }

  if (slotChoices.length === 0) return ["pass"];

  const rawCombinations = cartesianProduct(slotChoices);
  const validCombinations = filterValidCombinations(rawCombinations, req);

  // Remove duplicates like "pass, pass" becoming "pass" multiple times
  const uniqueCombinations = Array.from(new Set(validCombinations));

  // Move Ordering: Sort by priority (Mega > Attacks > Switches > Pass)
  return uniqueCombinations.sort((a, b) => getMovePriority(b) - getMovePriority(a));
}

function getBattleStateHash(battle: any, depth: number): string {
  const hashSide = (side: any) => {
    return side.pokemon
      .map((p: any) => {
        const boosts = Object.entries(p.boosts || {})
          .filter(([_, v]) => v !== 0)
          .map(([k, v]) => `${k}:${String(v)}`)
          .join(",");
        const volatiles = Object.keys(p.volatiles || {})
          .sort()
          .join(",");
        return `${String(p.hp)},${String(p.status)},${String(p.fainted)},B[${String(boosts)}],V[${String(volatiles)}]`;
      })
      .join("|");
  };

  const p1State = hashSide(battle.p1);
  const p2State = hashSide(battle.p2);
  const fieldState = Object.keys(battle.field?.pseudoWeather || {})
    .sort()
    .join(",");

  return `${depth}::${p1State}::${p2State}::F[${fieldState}]`;
}

export function solveTsume(tsumeData: TsumeData, maxDepth = 3): Record<string, string> {
  const responses: Record<string, string> = {};
  const transpositionTable = new Map<string, number>();

  function recurse(
    history: { p1: string; p2: string }[],
    currentDepth: number,
    historyKeyPath: string[],
  ): number {
    const engine = new TsumeEngine(tsumeData);
    for (const turn of history) {
      engine.simulateTurn(turn.p1, turn.p2);
    }

    if (engine.p2Fainted || engine.winner === "Player 1") return 1;
    if (engine.p1Fainted || engine.winner === "Player 2" || currentDepth >= maxDepth) return -1;

    const battle = (engine as any).battle;
    const stateHash = getBattleStateHash(battle, currentDepth);

    // Check transposition table
    if (transpositionTable.has(stateHash) && historyKeyPath.length > 0) {
      // NOTE: We only use transposition table for pure evaluation speedup,
      // but we STILL need to record the P2 responses for P1's new branches!
      // Actually, if we hit a cached state, we can't just return if we need to build the `responses` map for this path.
      // So memoization should only be used for P2's min-search (when evaluating P2 choices).
      // If we are evaluating P2's choices, historyKeyPath won't change!
      // Wait, historyKeyPath IS the P1 action sequence.
      // We only care about saving time when we are deeply evaluating P2's tree.
    }

    const p1Choices = getValidChoicesForSide(battle.p1);
    const p2Choices = getValidChoicesForSide(battle.p2);

    let scoreForState = -Infinity;

    for (const p1 of p1Choices) {
      let minScoreForP1Choice = Infinity;
      let bestP2 = p2Choices[0];

      const nextKeyPath = [...historyKeyPath, p1];
      const keyString = nextKeyPath.join(",");

      for (const p2 of p2Choices) {
        const p2Hash = stateHash + `|${p1}|${p2}`;
        let score;

        if (transpositionTable.has(p2Hash)) {
          score = transpositionTable.get(p2Hash)!;
        } else {
          const nextHistory = [...history, { p1, p2 }];
          score = recurse(nextHistory, currentDepth + 1, nextKeyPath);
          transpositionTable.set(p2Hash, score);
        }

        if (score < minScoreForP1Choice) {
          minScoreForP1Choice = score;
          bestP2 = p2;
          if (score === -1) break; // Alpha-beta pruning
        }
      }

      responses[keyString] = bestP2;

      if (minScoreForP1Choice > scoreForState) {
        scoreForState = minScoreForP1Choice;
      }
    }

    return scoreForState;
  }

  recurse([], 0, []);
  return responses;
}

export function solveProbabilisticTsumeDeep(
  tsumeData: TsumeData,
  maxDepth: number = 3,
  iterations: number = 20,
): Record<string, any> {
  const TT = new Map<string, number>();
  const responses: Record<string, string> = {};

  function evaluateState(
    history: { p1: string; p2: string; seed: number[] }[],
    currentDepth: number,
    historyKeyPath: string[],
  ): number {
    // 1. Fast-forward engine to current state deterministically
    const initialSeed = history.length > 0 ? history[0].seed : undefined;
    const engine = new TsumeEngine(tsumeData, initialSeed);

    // Play all past turns using their recorded seeds
    for (const turn of history) {
      engine.injectSeed(turn.seed);
      engine.simulateTurn(turn.p1, turn.p2);
    }

    // 2. Check terminal conditions
    if (engine.p2Fainted || engine.winner === "Player 1") return 1;
    if (engine.p1Fainted || engine.winner === "Player 2" || currentDepth >= maxDepth) return 0; // 0 for EV calculation (loss or max depth reached)

    // 3. Hash state and check Transposition Table (Memoization)
    const stateHash = getBattleStateHash((engine as any).battle, currentDepth);
    if (TT.has(stateHash)) {
      return TT.get(stateHash)!;
    }

    // 4. Generate choices for this turn
    const p1Choices = getValidChoicesForSide((engine as any).battle.p1);
    const p2Choices = getValidChoicesForSide((engine as any).battle.p2);

    let maxMinEV = -1;

    // 5. Evaluate Payoff Matrix
    for (const p1 of p1Choices) {
      let minEVForP1 = 1.1; // Find the worst-case EV for this P1 choice
      let worstP2ForThisP1 = p2Choices[0];

      for (const p2 of p2Choices) {
        let totalEV = 0;

        // Sample N times for this (P1, P2) pair
        for (let i = 0; i < iterations; i++) {
          const newSeed = [
            Math.floor(Math.random() * 0x10000),
            Math.floor(Math.random() * 0x10000),
            Math.floor(Math.random() * 0x10000),
            Math.floor(Math.random() * 0x10000),
          ];
          const nextHistory = [...history, { p1, p2, seed: newSeed }];

          const ev = evaluateState(nextHistory, currentDepth + 1, [...historyKeyPath, p1]);
          totalEV += ev;
        }

        const avgEV = totalEV / iterations;
        if (avgEV < minEVForP1) {
          minEVForP1 = avgEV;
          worstP2ForThisP1 = p2;
        }
      }

      responses[[...historyKeyPath, p1].join(",")] = worstP2ForThisP1;

      if (minEVForP1 > maxMinEV) {
        maxMinEV = minEVForP1;
      }
    }

    // Cache the result
    TT.set(stateHash, maxMinEV);
    return maxMinEV;
  }

  // Evaluate depth 0 manually to collect the EV for each P1 choice at the root.
  const engine = new TsumeEngine(tsumeData);
  const battle = (engine as any).battle;
  const p1Choices = getValidChoicesForSide(battle.p1);
  const p2Choices = getValidChoicesForSide(battle.p2);

  const evSummary: Record<string, { expectedWinRate: number; worstCaseP2Response: string }> = {};

  let bestP1Choice = p1Choices[0];
  let highestWorstCaseEv = -1;

  console.log(
    `Deep Expectiminimax: ${p1Choices.length} P1 Choices x ${p2Choices.length} P2 Choices (Depth: ${maxDepth}, Iterations: ${iterations})`,
  );

  for (const p1 of p1Choices) {
    let minEV = 1.1;
    let worstP2 = "";

    for (const p2 of p2Choices) {
      let totalEV = 0;
      for (let i = 0; i < iterations; i++) {
        const newSeed = [
          Math.floor(Math.random() * 0x10000),
          Math.floor(Math.random() * 0x10000),
          Math.floor(Math.random() * 0x10000),
          Math.floor(Math.random() * 0x10000),
        ];
        const ev = evaluateState([{ p1, p2, seed: newSeed }], 1, [p1]);
        totalEV += ev;
      }
      const avgEV = totalEV / iterations;
      if (avgEV < minEV) {
        minEV = avgEV;
        worstP2 = p2;
      }
    }

    evSummary[p1] = {
      expectedWinRate: minEV,
      worstCaseP2Response: worstP2,
    };
    responses[p1] = worstP2;

    if (minEV > highestWorstCaseEv) {
      highestWorstCaseEv = minEV;
      bestP1Choice = p1;
    }
  }

  console.log(`\n=== DEEP PROBABILISTIC SOLVER RESULTS ===`);
  for (const [p1Choice, summary] of Object.entries(evSummary)) {
    console.log(
      `- ${p1Choice}: Expected Win Rate ${(summary.expectedWinRate * 100).toFixed(1)}% (Worst-case P2: ${summary.worstCaseP2Response})`,
    );
  }
  console.log(
    `\nBest P1 Play: ${bestP1Choice} (Guarantees ${(highestWorstCaseEv * 100).toFixed(1)}% Win Rate)`,
  );
  console.log(`State Cache Size (Unique Branches Explored): ${TT.size}`);

  return { evSummary, responses };
}
