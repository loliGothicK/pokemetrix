import { Battle, PokemonSet, Side } from "@pkmn/sim";
import { Dex } from "@pkmn/dex";
import type { TsumeData, TsumePokemon } from "@/types/quiz";

export class TsumeEngine {
  private battle: Battle;

  constructor(
    public tsumeData: TsumeData,
    initialSeed?: number[],
  ) {
    const isSingles =
      tsumeData.playerSide.active.length === 1 &&
      tsumeData.opponentSide.active.length === 1 &&
      (!tsumeData.playerSide.bench || tsumeData.playerSide.bench.length === 0) &&
      (!tsumeData.opponentSide.bench || tsumeData.opponentSide.bench.length === 0);

    const formatid = isSingles ? "gen9customgame" : "gen9doublescustomgame";

    let prngSeed = initialSeed;
    if (!prngSeed) {
      prngSeed =
        tsumeData.rngControl?.mode === "probabilistic"
          ? [Math.floor(Math.random() * 10000), Math.floor(Math.random() * 10000), 3, 4]
          : [1, 2, 3, 4];
    }

    this.battle = new Battle({
      formatid: formatid as any,
      seed: prngSeed as any,
    });
    this.initialize();
  }

  private mapPokemon(poke: TsumePokemon): PokemonSet {
    return {
      name: poke.species,
      species: poke.species,
      item: poke.item || "",
      ability: poke.ability || "hardy",
      moves: poke.moves || [],
      nature: poke.nature || "Serious",
      // 努力値が未指定の場合は攻撃面を最大(252)とし、耐久を0にする（ワンパンを発生させやすくする）
      evs: { hp: 0, atk: 252, def: 0, spa: 252, spd: 0, spe: 252 },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      level: 50,
      gender: "",
      happiness: 255,
      hpType: "Dark",
      pokeball: "pokeball",
    };
  }

  private initialize() {
    const isSingles = this.battle.format.id === "gen9customgame";

    const p1Team = [
      ...this.tsumeData.playerSide.active.map(this.mapPokemon.bind(this)),
      ...(this.tsumeData.playerSide.bench || []).map(this.mapPokemon.bind(this)),
    ];
    const p2Team = [
      ...this.tsumeData.opponentSide.active.map(this.mapPokemon.bind(this)),
      ...(this.tsumeData.opponentSide.bench || []).map(this.mapPokemon.bind(this)),
    ];

    // Engine Hack: gen9doublescustomgame crashes if a team has only 1 Pokemon total.
    // Pad with a fainted dummy to satisfy the engine's 2-slot expectation.
    if (!isSingles) {
      if (p1Team.length === 1) {
        p1Team.push({ species: "Magikarp", hp: 0, moves: ["splash"] } as unknown as PokemonSet);
      }
      if (p2Team.length === 1) {
        p2Team.push({ species: "Magikarp", hp: 0, moves: ["splash"] } as unknown as PokemonSet);
      }
    }

    this.battle.setPlayer("p1", { name: "Player 1", team: p1Team });
    this.battle.setPlayer("p2", { name: "Player 2", team: p2Team });

    // In doubles, we must select 4 leads if available, or just as many as we have.
    // In singles, we select 1.
    const leadCount = isSingles ? 1 : 4;
    const p1LeadsStr = Array.from(
      { length: Math.min(leadCount, p1Team.length) },
      (_, i) => i + 1,
    ).join("");
    const p2LeadsStr = Array.from(
      { length: Math.min(leadCount, p2Team.length) },
      (_, i) => i + 1,
    ).join("");

    this.battle.makeChoices(`team ${p1LeadsStr}`, `team ${p2LeadsStr}`);

    // Apply states
    this.applySideState(this.battle.p1, this.tsumeData.playerSide.active);
    this.applySideState(this.battle.p2, this.tsumeData.opponentSide.active);

    // Check if the previous turn had an action that needs to be simulated (e.g. for Encore)
    if (this.tsumeData.correctMoves.includes("encore")) {
      const oppFirstMove = this.tsumeData.opponentSide.active[0]?.moves?.[0];
      if (oppFirstMove) {
        this.battle.p2.active[0].lastMove = Dex.moves.get(oppFirstMove) as any;
      }
    }

    // ==========================================
    // RNG Context Interception for Tsume
    // ==========================================
    type RNGContext =
      | "accuracy"
      | "crit"
      | "secondary"
      | "damage_roll"
      | "speed_tie"
      | "sleep_turns"
      | null;
    let currentContext: RNGContext = null;
    let currentAttacker: "p1" | "p2" | null = null;
    const rngRules = this.tsumeData.rngControl || { mode: "deterministic" };

    // Wrapper helper
    const wrapAction = (methodName: keyof typeof this.battle.actions, context: RNGContext) => {
      const original = (this.battle.actions as any)[methodName].bind(this.battle.actions);
      (this.battle.actions as any)[methodName] = (...args: any[]) => {
        const prevContext = currentContext;
        const prevAttacker = currentAttacker;

        currentContext = context;
        // Find the pokemon object in arguments
        const pokemonArg = args.find((a) => a && typeof a === "object" && a.side && a.side.id);
        if (pokemonArg) {
          currentAttacker = pokemonArg.side.id;
        }

        const res = original(...args);

        currentContext = prevContext;
        currentAttacker = prevAttacker;
        return res;
      };
    };

    wrapAction("runMove", "accuracy");
    wrapAction("modifyDamage", "crit");
    wrapAction("moveHit", "secondary");
    wrapAction("getDamage", "damage_roll");

    // Override randomChance (Accuracy, Crits, Secondary Effects)
    const originalRandomChance = this.battle.randomChance.bind(this.battle);
    this.battle.randomChance = (numerator: number, denominator: number) => {
      if (rngRules.mode === "probabilistic") {
        return originalRandomChance(numerator, denominator);
      }

      const isPlayer = currentAttacker === "p1";
      const ruleValue = (key: keyof typeof rngRules) => (rngRules[key] as string) || "worst_case";

      if (currentContext === "accuracy") {
        const accRule = ruleValue("accuracy");
        if (accRule === "vanilla") return originalRandomChance(numerator, denominator);
        if (accRule === "worst_case") return isPlayer ? numerator >= denominator : true;
        if (accRule === "perfect") return true;
      }

      if (currentContext === "damage_roll" || currentContext === "crit") {
        // Crits are calculated via randomChance(1, 24) inside getDamage
        const critRule = ruleValue("crits");
        if (critRule === "vanilla") return originalRandomChance(numerator, denominator);
        if (critRule === "none") return numerator >= denominator; // Only true if 100%
        if (critRule === "worst_case") return isPlayer ? numerator >= denominator : true;
        if (critRule === "always") return true;
        if (critRule === "opponent_only") return isPlayer ? numerator >= denominator : true;
      }

      if (currentContext === "secondary") {
        const secRule = ruleValue("secondaryEffects");
        if (secRule === "vanilla") return originalRandomChance(numerator, denominator);
        if (secRule === "none") return numerator >= denominator;
        if (secRule === "worst_case") return isPlayer ? numerator >= denominator : true;
        if (secRule === "always") return true;
        if (secRule === "opponent_only") return isPlayer ? numerator >= denominator : true;
      }

      return originalRandomChance(numerator, denominator);
    };

    // Override random (Damage Rolls, Speed Ties, Sleep Turns)
    const originalRandom = this.battle.random.bind(this.battle);
    this.battle.random = (m?: number, n?: number) => {
      if (rngRules.mode === "probabilistic") {
        return originalRandom(m, n);
      }

      const isPlayer = currentAttacker === "p1";

      // Damage Roll (random(16))
      if (currentContext === "damage_roll" && m === 16 && n === undefined) {
        const dmgRule = (rngRules.damageRoll as string) || "worst_case";
        if (dmgRule === "vanilla") return originalRandom(m, n);
        if (dmgRule === "expected") return 8; // Middle of 0-15
        if (dmgRule === "min") return 15; // 100 - 15 = 85%
        if (dmgRule === "max") return 0; // 100 - 0 = 100%
        if (dmgRule === "worst_case") return isPlayer ? 15 : 0;
      }

      // If we need to intercept speed ties or sleep turns, we could do it here
      // For now, vanilla behavior for other random() calls in deterministic mode unless handled
      return originalRandom(m, n);
    };
  }

  private applySideState(side: Side, activeData: TsumePokemon[]) {
    activeData.forEach((pokeData, i) => {
      const poke = side.active[i];
      if (!poke) return;
      if (pokeData.hpCurrent !== undefined) {
        poke.sethp(pokeData.hpCurrent);
      }
      if (pokeData.status) {
        poke.setStatus(pokeData.status);
      }
      // Volatiles and stat stages can be added here later
    });
  }

  public injectSeed(seed: number[]) {
    // Overwrite the PRNG seed mid-battle
    (this.battle.prng as any).seed = [...seed] as any;
  }

  /**
   * Simulate a single turn given choices for p1 and p2.
   * Returns true if the battle is over.
   */
  public simulateTurn(p1Choice: string, p2Choice: string): boolean {
    try {
      this.battle.makeChoices(p1Choice, p2Choice);
    } catch (e) {
      console.log("CRASH in simulateTurn!");
      console.log("P1 Choice:", p1Choice);
      console.log("P2 Choice:", p2Choice);
      console.log("P1 Queued Choices:", this.battle.p1.choice);
      console.log("P2 Queued Choices:", this.battle.p2.choice);
      console.log("P1 Request:", JSON.stringify(this.battle.p1.activeRequest, null, 2));
      console.log("P2 Request:", JSON.stringify(this.battle.p2.activeRequest, null, 2));
      throw e;
    }
    return this.battle.ended;
  }

  public getLog(): string[] {
    return this.battle.log;
  }

  public getP1ActiveHP(index = 0): number {
    return this.battle.p1.active[index]?.hp || 0;
  }

  public getP1ActiveMaxHP(index = 0): number {
    return this.battle.p1.active[index]?.maxhp || 1;
  }

  public getP2ActiveHP(index = 0): number {
    return this.battle.p2.active[index]?.hp || 0;
  }

  public getP2ActiveMaxHP(index = 0): number {
    return this.battle.p2.active[index]?.maxhp || 1;
  }

  public get winner(): string | undefined {
    return this.battle.winner;
  }

  public get p1Fainted(): boolean {
    return this.battle.p1.pokemon.every((p) => p.fainted || p.hp <= 0);
  }

  public get p2Fainted(): boolean {
    return this.battle.p2.pokemon.every((p) => p.fainted || p.hp <= 0);
  }

  /**
   * Evaluates the pre-computed optimal response for the given history key.
   */
  public getOpponentHeuristicChoice(historyKey: string): string {
    if (this.tsumeData.opponentResponses && this.tsumeData.opponentResponses[historyKey]) {
      return this.tsumeData.opponentResponses[historyKey];
    }
    return "default";
  }
}
