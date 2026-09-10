import { TsumeEngine } from "./tsumeEngine";

import type { Pokemon } from "@pkmn/sim";
import type { TsumeData } from "@/types/quiz";

const isMoveRequest = (req: unknown): req is import("@pkmn/sim").MoveRequest =>
  !!req && typeof req === "object" && "active" in req;
function cartesianProduct<T>(arr: T[][]): T[][] {
  return arr.reduce((a, b) => a.flatMap((d) => b.map((e) => [...d, e])), [[]] as T[][]);
}

function filterValidCombinations(combinations: string[][], reqMovesTyped: unknown): string[] {
  const validCombinations = combinations.filter((combo) => {
    // 1. Multiple megas are not allowed
    const megas = combo.filter((c) => c.includes("mega")).length;
    if (megas > 1) return false;

    // 2. Duplicate switches (e.g. switching the same Pokemon into 2 different slots)
    const switches = combo.filter((c) => c.startsWith("switch"));
    const uniqueSwitches = new Set(switches);
    if (uniqueSwitches.size !== switches.length) return false;

    // 3. For forced switches, you MUST fill slots if you have bench Pokémon
    if (isMoveRequest(reqMovesTyped) && reqMovesTyped.forceSwitch) {
      // The combination length is the same as forceSwitch array length
      // Find how many forced switches we actually NEED to fill
      // const numForcedSwitches = reqMovesTyped.forceSwitch.filter((b: boolean) => b).length;
      // If we filled fewer slots than we need to, we must check if we ran out of bench Pokémon.
      // The uniqueSwitches we generated earlier tells us how many bench Pokémon we used.
      // We cannot use more than we have, but if we used LESS than `numForcedSwitches`
      // AND there were still more bench Pokémon available (which we know if `choicesForThisSlot` had other switches),
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
  if (isMoveRequest(reqMovesTyped) && reqMovesTyped.forceSwitch) {
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

function getChoiceScore(
  choice: string,
  sideObj: import("@pkmn/sim").Side,
  battle: import("@pkmn/sim").Battle,
): number {
  if (!choice || typeof choice !== "string") return 0;
  if (choice === "pass") return 0;

  let totalScore = 0;
  const parts = choice.split(",");
  const req = sideObj.activeRequest;

  parts.forEach((part, slotIdx) => {
    part = part.trim();
    if (part === "pass") {
      totalScore += 0;
    } else if (part.startsWith("switch")) {
      totalScore += 5;
    } else if (part.startsWith("move")) {
      let score = 10;
      if (part.includes("mega")) score += 5;

      const match = part.match(/^move (\d+)/);
      if (match && isMoveRequest(req) && req.active && req.active[slotIdx]) {
        const moveIndex = parseInt(match[1], 10) - 1;
        const moveRef = isMoveRequest(req) ? req.active[slotIdx]?.moves[moveIndex] : null;
        if (moveRef) {
          const moveData = battle.dex.moves.get(moveRef.id || moveRef.move || "");
          if (moveData) {
            if (moveData.priority > 0) score += 20;
            if (
              [
                "protect",
                "detect",
                "spikyshield",
                "kingsshield",
                "banefulbunker",
                "obstruct",
                "silktrap",
                "burningbulwark",
              ].includes(moveData.id)
            ) {
              score += 50;
            }
            if (moveData.id === "fakeout") {
              score += 40;
            }

            const targetMatch = part.match(/^move \d+(?: mega)? (-?\d+)/);
            if (targetMatch) {
              const targetSlot = parseInt(targetMatch[1], 10);
              let targetPokemon = null;
              if (targetSlot > 0 && sideObj.foe && sideObj.foe.active) {
                targetPokemon = sideObj.foe.active[targetSlot - 1];
              } else if (targetSlot < 0 && sideObj.active) {
                targetPokemon = sideObj.active[Math.abs(targetSlot) - 1];
              }

              if (targetPokemon && moveData.category !== "Status") {
                const effectiveness = battle.dex.getEffectiveness(
                  moveData.type,
                  targetPokemon.types,
                );
                if (effectiveness > 0) score += 15;
                else if (effectiveness < 0) score -= 5;
              }
            }
          }
        }
      }
      totalScore += score;
    }
  });

  return totalScore;
}

export function getValidChoicesForSide(
  battle: import("@pkmn/sim").Battle,
  sideObj: import("@pkmn/sim").Side,
): string[] {
  const req = sideObj.activeRequest;
  if (!req) return ["pass"];

  const slotChoices: string[][] = [];

  if (req.forceSwitch) {
    req.forceSwitch.forEach((needsSwitch: boolean) => {
      const choicesForThisSlot: string[] = [];
      if (needsSwitch) {
        sideObj.pokemon.forEach((mon: Pokemon, i: number) => {
          if (i >= req.forceSwitch.length && mon.hp > 0 && !mon.fainted) {
            choicesForThisSlot.push(`switch ${i + 1}`);
          }
        });
        choicesForThisSlot.push("pass");
      } else {
        choicesForThisSlot.push("pass");
      }
      slotChoices.push(choicesForThisSlot.length > 0 ? choicesForThisSlot : ["pass"]);
    });
  } else if (isMoveRequest(req) && req.active) {
    req.active.forEach((activeMon, activeIdx: number) => {
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

      if (!activeMon.moves) return;
      activeMon.moves.forEach((moveReq, moveIdx: number) => {
        if (!moveReq.disabled) {
          const moveId = moveIdx + 1;
          const variants: string[] = [`move ${moveId}`];
          if (activeMon.canMegaEvo) {
            variants.push(`move ${moveId} mega`);
          }

          const moveData = battle.dex.moves.get(moveReq.id || moveReq.move);

          variants.forEach((v) => {
            if (moveReq.target === "normal" || moveReq.target === "any") {
              if (sideObj.active.length > 1) {
                const target1 = sideObj.foe.active[0];
                const target2 = sideObj.foe.active[1];
                const ally = sideObj.active[activeIdx === 0 ? 1 : 0];

                if (target1 && target1.hp > 0 && !target1.fainted) {
                  let isImmune = false;
                  if (moveData && moveData.category !== "Status") {
                    if (!battle.dex.getImmunity(moveData.type, target1.types)) isImmune = true;
                  }
                  if (!isImmune) choicesForThisSlot.push(`${v} 1`);
                }
                if (target2 && target2.hp > 0 && !target2.fainted) {
                  let isImmune = false;
                  if (moveData && moveData.category !== "Status") {
                    if (!battle.dex.getImmunity(moveData.type, target2.types)) isImmune = true;
                  }
                  if (!isImmune) choicesForThisSlot.push(`${v} 2`);
                }
                if (ally && ally.hp > 0 && !ally.fainted) {
                  let allowAllyTarget = false;

                  if (moveData) {
                    // Safe status moves (e.g., Helping Hand, Heal Pulse, Protect etc. though target may not be 'normal')
                    if (moveData.category === "Status" && !moveData.status && !moveData.boosts) {
                      allowAllyTarget = true;
                    }

                    // Allow pivot moves (U-turn, Parting Shot) targeted at ally to avoid Protect
                    if (moveData.selfSwitch) {
                      allowAllyTarget = true;
                    }

                    // Stat-altering or status moves
                    if (moveData.category === "Status") {
                      // Allow speed control (Scary Face, Thunder Wave)
                      if (
                        moveData.id === "thunderwave" ||
                        moveData.id === "scaryface" ||
                        moveData.id === "stringshot"
                      ) {
                        allowAllyTarget = true;
                      }

                      // Allow status moves if ally benefits from it (e.g. Guts, Marvel Scale)
                      const allyAbility = ally.baseAbility || ally.ability || "";
                      const normalizedAbility =
                        typeof allyAbility === "string"
                          ? allyAbility.toLowerCase().replace(/[^a-z0-9]/g, "")
                          : "";
                      const statusBenefitingAbilities = [
                        "guts",
                        "marvelscale",
                        "quickfeet",
                        "toxicboost",
                        "flareboost",
                      ];
                      if (
                        moveData.status &&
                        statusBenefitingAbilities.includes(normalizedAbility)
                      ) {
                        allowAllyTarget = true;
                      }
                    }

                    // Damaging moves
                    if (moveData.category !== "Status") {
                      const allyItem = ally.item
                        ? ally.item.toLowerCase().replace(/[^a-z0-9]/g, "")
                        : "";
                      const allyAbility = ally.baseAbility || ally.ability || "";
                      const normalizedAbility =
                        typeof allyAbility === "string"
                          ? allyAbility.toLowerCase().replace(/[^a-z0-9]/g, "")
                          : "";

                      // Only allow low power or priority moves to target ally (prevent using high power nukes on allies)
                      if (moveData.basePower <= 60 || moveData.priority > 0) {
                        // Weakness Policy proc
                        if (allyItem === "weaknesspolicy") {
                          if (battle.dex.getEffectiveness(moveData.type, ally.types) > 0) {
                            allowAllyTarget = true;
                          }
                        }

                        // Berries proc (usually with low power moves or priority)
                        const berries = [
                          "sitrusberry",
                          "figyberry",
                          "iapapaberry",
                          "wikiberry",
                          "aguavberry",
                          "magoberry",
                        ];
                        if (berries.includes(allyItem)) {
                          allowAllyTarget = true;
                        }

                        // Ability procs (Justified, Stamina, Water Compaction, Anger Point)
                        if (normalizedAbility === "justified" && moveData.type === "Dark")
                          allowAllyTarget = true;
                        if (normalizedAbility === "watercompaction" && moveData.type === "Water")
                          allowAllyTarget = true;
                        if (normalizedAbility === "stamina") allowAllyTarget = true;
                        if (normalizedAbility === "angerpoint" && moveData.willCrit)
                          allowAllyTarget = true; // Frost Breath, Storm Throw
                      }
                    }
                  }

                  if (allowAllyTarget) {
                    choicesForThisSlot.push(`${v} -${activeIdx === 0 ? 2 : 1}`);
                  }
                }
              } else {
                choicesForThisSlot.push(v);
              }
            } else {
              choicesForThisSlot.push(v);
            }
          });
        }
      });

      if (isMoveRequest(req) && req.noSwitch && req.noSwitch[activeIdx]) {
        let isActiveInDanger = false;
        const activeMonRef = sideObj.active[activeIdx];
        if (activeMonRef && activeMonRef.volatiles) {
          if (
            activeMonRef.volatiles.perishsong ||
            activeMonRef.volatiles.encore ||
            activeMonRef.volatiles.leechseed
          ) {
            isActiveInDanger = true;
          }
        }

        sideObj.pokemon.forEach((mon: Pokemon, i: number) => {
          if (i >= sideObj.active.length && mon.hp > 0 && !mon.fainted) {
            let allowSwitch = !!req.forceSwitch;

            if (!allowSwitch) {
              if (isActiveInDanger) allowSwitch = true;

              const abilityId = mon.baseAbility || mon.ability;
              if (abilityId) {
                const onSwitchInAbilities = [
                  "intimidate",
                  "hospitality",
                  "drought",
                  "drizzle",
                  "sandstream",
                  "snowwarning",
                  "grassysurge",
                  "psychicsurge",
                  "electricsurge",
                  "mistysurge",
                  "regenerator",
                  "naturalcure",
                  "trace",
                  "download",
                  "imposter",
                ];
                const normalizedId =
                  typeof abilityId === "string"
                    ? abilityId.toLowerCase().replace(/[^a-z0-9]/g, "")
                    : "";
                if (onSwitchInAbilities.includes(normalizedId)) {
                  allowSwitch = true;
                }
              }
            }

            if (allowSwitch) {
              choicesForThisSlot.push(`switch ${i + 1}`);
            }
          }
        });
      }

      slotChoices.push(choicesForThisSlot.length > 0 ? choicesForThisSlot : ["pass"]);
    });
  }

  if (slotChoices.length === 0) return ["pass"];

  const rawCombinations = cartesianProduct(slotChoices);
  const validCombinations = filterValidCombinations(rawCombinations, req);
  // Remove duplicates
  const uniqueCombinations = Array.from(new Set(validCombinations));

  console.log(
    `[getValidChoicesForSide] side: ${sideObj.name}, choices: ${uniqueCombinations.length}`,
  );

  return uniqueCombinations.sort(
    (a, b) => getChoiceScore(b, sideObj, battle) - getChoiceScore(a, sideObj, battle),
  );
}

function evaluateHeuristicScore(battle: import("@pkmn/sim").Battle): number {
  let p1Score = 0;
  let p2Score = 0;

  if (battle.p1 && battle.p1.pokemon) {
    battle.p1.pokemon.forEach((mon: Pokemon) => {
      if (!mon.fainted && mon.hp > 0) {
        p1Score += mon.hp / mon.maxhp;
        if (mon.status) p1Score -= 0.1;
      }
    });
  }

  if (battle.p2 && battle.p2.pokemon) {
    battle.p2.pokemon.forEach((mon: Pokemon) => {
      if (!mon.fainted && mon.hp > 0) {
        p2Score += mon.hp / mon.maxhp;
        if (mon.status) p2Score -= 0.1;
      }
    });
  }

  const diff = p1Score - p2Score;
  let evalScore = diff * 0.2;

  if (evalScore >= 1) evalScore = 0.99;
  if (evalScore <= -1) evalScore = -0.99;

  return evalScore;
}

function getBinds(battle: import("@pkmn/sim").Battle) {
  const binds: {
    attackerSide: string;
    attackerIdx: number;
    defenderSide: string;
    defenderIdx: number;
    moveId: string;
  }[] = [];

  const allLethals: Array<{
    attacker: Pokemon;
    aIdx: number;
    defender: Pokemon;
    dIdx: number;
    atkSide: import("@pkmn/sim").Side;
    defSide: import("@pkmn/sim").Side;
    moveId: string;
    priority: number;
  }> = [];

  const checkLethal = (atkSide: import("@pkmn/sim").Side, defSide: import("@pkmn/sim").Side) => {
    atkSide.active.forEach((attacker: Pokemon, aIdx: number) => {
      if (!attacker || attacker.hp <= 0 || attacker.fainted) return;
      defSide.active.forEach((defender: Pokemon, dIdx: number) => {
        if (!defender || defender.hp <= 0 || defender.fainted) return;

        let bestLethal: { moveId: string; priority: number } | null = null;
        for (const moveId of attacker.moves) {
          const move = battle.dex.moves.get(moveId);
          if (!move) continue;
          const dmg = battle.actions.getDamage(attacker, defender, moveId);
          if (typeof dmg === "number" && dmg >= defender.hp) {
            if (!bestLethal || move.priority > bestLethal.priority) {
              bestLethal = { moveId, priority: move.priority };
            }
          }
        }
        const bl = bestLethal;
        if (bl) {
          allLethals.push({
            attacker,
            aIdx,
            defender,
            dIdx,
            atkSide,
            defSide,
            moveId: bl.moveId,
            priority: bl.priority,
          });
        }
      });
    });
  };

  checkLethal(battle.p1, battle.p2);
  checkLethal(battle.p2, battle.p1);

  allLethals.forEach((lethal) => {
    const { attacker, defender, priority, moveId, atkSide, defSide, aIdx, dIdx } = lethal;

    // Check if defender can also lethal attacker
    const counterLethal = allLethals.find(
      (l) => l.attacker === defender && l.defender === attacker,
    );
    let canBind = false;

    if (!counterLethal) {
      if (priority > 0 || attacker.getStat("spe") > defender.getStat("spe")) {
        canBind = true;
      }
    } else {
      if (priority > counterLethal.priority) {
        canBind = true;
      } else if (priority === counterLethal.priority) {
        if (attacker.getStat("spe") > defender.getStat("spe")) {
          canBind = true;
        }
      }
    }

    if (canBind) {
      binds.push({
        attackerSide: atkSide.id,
        attackerIdx: aIdx,
        defenderSide: defSide.id,
        defenderIdx: dIdx,
        moveId,
      });
    }
  });

  return binds;
}

function getBattleStateHash(battle: import("@pkmn/sim").Battle, depth: number): string {
  const binds = getBinds(battle);

  const hashSide = (side: import("@pkmn/sim").Side, sideId: string) => {
    let sideHash = "";
    for (let idx = 0; idx < side.pokemon.length; idx++) {
      const p = side.pokemon[idx];
      let hpStr = String(p.hp);

      if (idx < side.active.length && p.hp > 0 && !p.fainted) {
        let isBound = false;
        for (let i = 0; i < binds.length; i++) {
          const b = binds[i];
          if (b.defenderSide === sideId && b.defenderIdx === idx) {
            if (!isBound) {
              hpStr = "B[";
              isBound = true;
            } else {
              hpStr += ",";
            }
            hpStr += b.attackerSide + b.attackerIdx + ":" + b.moveId;
          }
        }
        if (isBound) hpStr += "]";
      }

      let boostStr = "";
      if (p.boosts) {
        const boosts = p.boosts;
        Object.entries(boosts).forEach(([k, val]) => {
          if (val !== 0) {
            sideHash += `|b:${k}=${val}`;
          }
        });
      }

      let volStr = "";
      if (p.volatiles) {
        volStr = Object.keys(p.volatiles).join(","); // keeping sort out to save time, order usually deterministic
      }

      sideHash += hpStr + p.status + p.fainted + boostStr + volStr + "|";
    }
    return sideHash;
  };

  const p1State = hashSide(battle.p1, "p1");
  const p2State = hashSide(battle.p2, "p2");

  let fieldState = "";
  if (battle.field?.pseudoWeather) {
    fieldState = Object.keys(battle.field.pseudoWeather).join(",");
  }

  return depth + "::" + p1State + p2State + fieldState;
}

export function solveTsume(
  tsumeData: TsumeData,
  maxDepth = 3,
  useHeuristic = false,
  timeoutMs?: number,
): Record<string, string> {
  const transpositionTable = new Map<
    string,
    { score: number; flag: "exact" | "lower" | "upper"; bestP1Move?: string; bestP2Move?: string }
  >();
  const startTime = Date.now();

  function recurse(
    history: { p1: string; p2: string }[],
    currentDepth: number,
    historyKeyPath: string[],
    alpha: number = -Infinity,
    beta: number = Infinity,
  ): number {
    if (timeoutMs && Date.now() - startTime > timeoutMs) {
      throw new Error("TSUME_TIMEOUT");
    }

    const originalAlpha = alpha;
    const engine = new TsumeEngine(tsumeData);
    for (const turn of history) {
      engine.simulateTurn(turn.p1, turn.p2);
    }

    if (engine.p2Fainted || engine.winner === "Player 1") return 1;
    if (engine.p1Fainted || engine.winner === "Player 2") return -1;

    const battle = engine["battle"];
    if (currentDepth >= currentSearchDepth) {
      return useHeuristic ? evaluateHeuristicScore(battle) : -1;
    }

    // Notice we compute the stateHash WITHOUT depth here, because the board state is what matters.
    // However, since depth affects remaining turns, storing depth in TT is usually required for strict exact match.
    // For PV move ordering, we can ignore depth and just use the pure state hash to get a hint.
    // We will keep the original getBattleStateHash which includes depth, but maybe create a depthless one for move hints.
    const stateHash = getBattleStateHash(battle, currentDepth);
    const ttEntry = transpositionTable.get(stateHash);

    // We can also look up a depthless hash just for move ordering
    const depthlessHash = getBattleStateHash(battle, 0); // use depth 0 as depthless
    const ttHintEntry = transpositionTable.get(depthlessHash);

    if (ttEntry && historyKeyPath.length > 0) {
      if (ttEntry.flag === "exact") {
        return ttEntry.score;
      } else if (ttEntry.flag === "lower") {
        alpha = Math.max(alpha, ttEntry.score);
      } else if (ttEntry.flag === "upper") {
        beta = Math.min(beta, ttEntry.score);
      }
      if (alpha >= beta) {
        return ttEntry.score;
      }
    }

    // ★ Null Move Pruning ★
    if (
      useHeuristic &&
      currentDepth < currentSearchDepth - 2 &&
      (!battle.p1.activeRequest || !battle.p1.activeRequest.forceSwitch)
    ) {
      const hasTrickRoom = battle.field?.pseudoWeather && !!battle.field.pseudoWeather["trickroom"];
      const hasP1Tailwind = battle.p1?.sideConditions && !!battle.p1.sideConditions["tailwind"];
      const hasP2Tailwind = battle.p2?.sideConditions && !!battle.p2.sideConditions["tailwind"];

      if (!hasTrickRoom && !hasP1Tailwind && !hasP2Tailwind) {
        const p2NullChoices = getValidChoicesForSide(battle, battle.p2);

        let minScoreForNull = Infinity;

        for (const p2 of p2NullChoices) {
          const nextHistory = [...history, { p1: "default", p2: p2 }];
          const score = recurse(nextHistory, currentDepth + 2, historyKeyPath, alpha, beta);
          if (score < minScoreForNull) {
            minScoreForNull = score;
          }
          if (minScoreForNull <= alpha) break;
        }

        if (minScoreForNull >= beta) {
          return beta; // Null Move Pruning Beta Cutoff!
        }
      }
    }

    const orderChoices = (choices: string[], pvMove?: string) => {
      return choices.sort((a, b) => {
        if (pvMove) {
          if (a === pvMove) return -1000;
          if (b === pvMove) return 1000;
        }
        const getScore = (c: string) => {
          let score = 0;
          if (
            c.includes("mega") ||
            c.includes("zmove") ||
            c.includes("terastallize") ||
            c.includes("dynamax")
          )
            score += 10;
          if (c.includes("switch")) score -= 10;
          if (c.includes(" 1") || c.includes(" 2")) score += 5; // attacking opponent
          if (c.includes(" -1") || c.includes(" -2")) score -= 5; // attacking ally
          return score;
        };
        return getScore(b) - getScore(a);
      });
    };

    const pvP1 = ttHintEntry?.bestP1Move;
    const pvP2 = ttHintEntry?.bestP2Move;

    const p1Choices = orderChoices(getValidChoicesForSide(battle, battle.p1), pvP1);
    const p2Choices = orderChoices(getValidChoicesForSide(battle, battle.p2), pvP2);

    let scoreForState = -Infinity;
    let bestP1MoveForState = p1Choices[0];
    let bestP2MoveForState = p2Choices[0];

    for (let i = 0; i < p1Choices.length; i++) {
      const p1 = p1Choices[i];
      let minScoreForP1Choice = Infinity;
      let bestP2 = p2Choices[0];

      const nextKeyPath = [...historyKeyPath, p1];
      const keyString = nextKeyPath.join(",");

      for (let j = 0; j < p2Choices.length; j++) {
        const p2 = p2Choices[j];
        const nextHistory = [...history, { p1, p2 }];

        let score: number;
        // Late Move Reductions (LMR)
        // Aggressive reduction for very late moves
        const isLateMove = i > 2 || j > 2;
        const isVeryLateMove = i > 8 || j > 8;
        const canReduce = useHeuristic && currentDepth < currentSearchDepth - 2 && isLateMove;

        if (canReduce) {
          const reduction = isVeryLateMove && currentDepth < currentSearchDepth - 3 ? 3 : 2;
          score = recurse(nextHistory, currentDepth + reduction, nextKeyPath, alpha, beta);
          if (score > alpha) {
            score = recurse(nextHistory, currentDepth + 1, nextKeyPath, alpha, beta);
          }
        } else {
          score = recurse(nextHistory, currentDepth + 1, nextKeyPath, alpha, beta);
        }

        if (score < minScoreForP1Choice) {
          minScoreForP1Choice = score;
          bestP2 = p2;
        }

        if (minScoreForP1Choice <= alpha) {
          break;
        }
      }

      currentResponses[keyString] = bestP2;

      if (minScoreForP1Choice > scoreForState) {
        scoreForState = minScoreForP1Choice;
        bestP1MoveForState = p1;
        bestP2MoveForState = bestP2;
      }

      if (scoreForState > alpha) {
        alpha = scoreForState;
      }

      // Alpha cutoff (P1 won't choose this state if P2 can force a worse outcome than P1 already has)
      if (alpha >= beta) {
        break;
      }
    }

    let ttFlag: "exact" | "lower" | "upper" = "exact";
    if (scoreForState <= originalAlpha) {
      ttFlag = "upper";
    } else if (scoreForState >= beta) {
      ttFlag = "lower";
    }

    transpositionTable.set(stateHash, {
      score: scoreForState,
      flag: ttFlag,
      bestP1Move: bestP1MoveForState,
      bestP2Move: bestP2MoveForState,
    });
    transpositionTable.set(depthlessHash, {
      score: scoreForState,
      flag: ttFlag,
      bestP1Move: bestP1MoveForState,
      bestP2Move: bestP2MoveForState,
    });

    return scoreForState;
  }

  let currentSearchDepth = 1;
  let bestResponses: Record<string, string> = {};
  let currentResponses: Record<string, string> = {};

  try {
    for (currentSearchDepth = 1; currentSearchDepth <= maxDepth; currentSearchDepth++) {
      currentResponses = {};
      recurse([], 0, []);
      bestResponses = { ...currentResponses }; // Save the completed depth's responses
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "TSUME_TIMEOUT") {
      // If timed out, return the best responses from the last fully completed depth
      // If even depth 1 didn't complete, it returns empty (or partial if we want to save it, but returning last complete is safer)
      return bestResponses;
    }
    throw err;
  }

  return bestResponses;
}

export function solveProbabilisticTsumeDeep(
  tsumeData: TsumeData,
  maxDepth: number = 3,
  iterations: number = 20,
  useHeuristic = false,
  timeoutMs?: number,
): Record<string, unknown> {
  const TT = new Map<string, number>();
  const responses: Record<string, string> = {};
  const startTime = Date.now();

  function evaluateState(
    history: { p1: string; p2: string; seed: number[] }[],
    currentDepth: number,
    historyKeyPath: string[],
  ): number {
    if (timeoutMs && Date.now() - startTime > timeoutMs) {
      throw new Error("TSUME_TIMEOUT");
    }

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
    if (engine.p1Fainted || engine.winner === "Player 2") return -1;

    const battle = engine["battle"];
    if (currentDepth >= maxDepth) {
      return useHeuristic ? evaluateHeuristicScore(battle) : 0;
    }

    // 3. Hash state and check Transposition Table (Memoization)
    const stateHash = getBattleStateHash(battle, currentDepth);
    if (TT.has(stateHash)) {
      return TT.get(stateHash)!;
    }

    // 4. Generate choices for this turn
    const p1Choices = getValidChoicesForSide(battle, battle.p1);
    const p2Choices = getValidChoicesForSide(battle, battle.p2);

    let maxMinEV = -Infinity;

    // 5. Evaluate Payoff Matrix
    for (const p1 of p1Choices) {
      let minEVForP1 = Infinity; // Find the worst-case EV for this P1 choice
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
          // Beta cutoff
          if (minEVForP1 <= maxMinEV) break;
        }
      }

      responses[[...historyKeyPath, p1].join(",")] = worstP2ForThisP1;

      if (minEVForP1 > maxMinEV) {
        maxMinEV = minEVForP1;
      }

      // Alpha cutoff
      if (maxMinEV >= 1) break;
    }

    // Cache the result
    TT.set(stateHash, maxMinEV);
    return maxMinEV;
  }

  // Evaluate depth 0 manually to collect the EV for each P1 choice at the root.
  const engine = new TsumeEngine(tsumeData);
  const battle = engine["battle"];
  const p1Choices = getValidChoicesForSide(battle, battle.p1);
  const p2Choices = getValidChoicesForSide(battle, battle.p2);

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
