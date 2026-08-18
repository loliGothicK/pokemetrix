import { Battle, PokemonSet, Side } from "@pkmn/sim";
import { Dex } from "@pkmn/dex";
import type { TsumeData, TsumePokemon } from "@/types/quiz";

export class TsumeEngine {
  private battle: Battle;

  constructor(public tsumeData: TsumeData) {
    this.battle = new Battle({ formatid: "gen9customgame" as any });
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
    const p1Team = [
      ...this.tsumeData.playerSide.active.map(this.mapPokemon.bind(this)),
      ...(this.tsumeData.playerSide.bench || []).map(this.mapPokemon.bind(this)),
    ];
    const p2Team = [
      ...this.tsumeData.opponentSide.active.map(this.mapPokemon.bind(this)),
      ...(this.tsumeData.opponentSide.bench || []).map(this.mapPokemon.bind(this)),
    ];

    this.battle.setPlayer("p1", { name: "Player 1", team: p1Team });
    this.battle.setPlayer("p2", { name: "Player 2", team: p2Team });

    // Send out leads
    const p1Leads = this.tsumeData.playerSide.active.map((_, i) => `team ${i + 1}`).join(", ");
    const p2Leads = this.tsumeData.opponentSide.active.map((_, i) => `team ${i + 1}`).join(", ");
    this.battle.makeChoices(p1Leads, p2Leads);

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

    // 詰将棋モードの乱数固定化（ダーティーハック）
    // getDamage をフックして、現在どちらが攻撃しているかをトラッキング
    const originalGetDamage = this.battle.actions.getDamage.bind(this.battle.actions);
    let currentAttacker: string | null = null;
    this.battle.actions.getDamage = (
      pokemon: any,
      target: any,
      move: any,
      suppressMessages: any,
    ) => {
      currentAttacker = pokemon.side.id;
      const damage = originalGetDamage(pokemon, target, move, suppressMessages);
      currentAttacker = null;
      return damage;
    };

    // random をフックして、ダメージ乱数（m=16）時に確定乱数を返す
    const originalRandom = this.battle.random.bind(this.battle);
    this.battle.random = (m?: number, n?: number) => {
      // 16段階のダメージ乱数（0〜15）の時
      if (m === 16 && n === undefined && currentAttacker) {
        // ダメージ係数は 100 - random(16)
        // 相手(p2)の攻撃なら最大ダメージ(0)、自分(p1)の攻撃なら最低ダメージ(15)
        return currentAttacker === "p2" ? 0 : 15;
      }
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

  /**
   * Simulate a single turn given choices for p1 and p2.
   * Returns true if the battle is over.
   */
  public simulateTurn(p1Choice: string, p2Choice: string): boolean {
    this.battle.makeChoices(p1Choice, p2Choice);
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

  /**
   * Simple heuristic opponent: always picks the first move.
   * Later we can implement minimax.
   */
  public getOpponentHeuristicChoice(): string {
    const oppMoves = this.tsumeData.opponentSide.active[0]?.moves;
    if (oppMoves && oppMoves.length > 0) {
      return `move ${oppMoves[0]}`;
    }
    return "default";
  }
}
