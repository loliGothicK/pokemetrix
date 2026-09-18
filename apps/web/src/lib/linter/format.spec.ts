import { describe, it, expect } from "vitest";
import i18next from "i18next";
import jaTranslation from "@locales/ja/translation.json";
import enTranslation from "@locales/en/translation.json";
import { formatLintIssue } from "./format";
import { noItem, wrongMegaStone, remainingEvs, suboptimalEvs } from "./errors/LintError";
import type { LintIssue } from "./linter";

const i18nJa = i18next.createInstance();
await i18nJa.init({
  lng: "ja",
  resources: { ja: { translation: jaTranslation } },
});

const i18nEn = i18next.createInstance();
await i18nEn.init({
  lng: "en",
  resources: { en: { translation: enTranslation } },
});

describe("formatLintIssue", () => {
  it("持ち物なし (noItem) を正しくローカライズする", () => {
    const issue: LintIssue = {
      target: "item",
      severity: "warning",
      source: noItem("No item"),
    };

    expect(formatLintIssue(issue, i18nJa.t.bind(i18nJa))).toBe("持ち物が持たされていません");
    expect(formatLintIssue(issue, i18nEn.t.bind(i18nEn))).toBe("No held item");
  });

  it("メガシンカ不可ポケモンのメガストーン所持 (cannotMega) を正しくローカライズする", () => {
    const issue: LintIssue = {
      target: "item",
      severity: "warning",
      source: wrongMegaStone("A Pokémon that cannot Mega Evolve is holding a Mega Stone.", {
        reason: "cannotMega",
      }),
    };

    expect(formatLintIssue(issue, i18nJa.t.bind(i18nJa))).toBe(
      "メガシンカできないポケモンにメガストーンが持たされています",
    );
    expect(formatLintIssue(issue, i18nEn.t.bind(i18nEn))).toBe(
      "A Pokémon that cannot Mega Evolve is holding a Mega Stone",
    );
  });

  it("異なるメガストーン所持 (wrongStone) を正しくローカライズする", () => {
    const issue: LintIssue = {
      target: "item",
      severity: "warning",
      source: wrongMegaStone("This is wrong Mega Stone.", {
        reason: "wrongStone",
      }),
    };

    expect(formatLintIssue(issue, i18nJa.t.bind(i18nJa))).toBe("このポケモンに対応していないメガストーンです");
    expect(formatLintIssue(issue, i18nEn.t.bind(i18nEn))).toBe("This Mega Stone does not match this Pokémon");
  });

  it("努力値余り (remainingEvs) を正しくローカライズする", () => {
    const issue: LintIssue = {
      target: "status",
      severity: "warning",
      source: remainingEvs("pikachu has 10 remaining EVs.", {
        identifier: "pikachu",
        remaining: 10,
      }),
    };

    expect(formatLintIssue(issue, i18nJa.t.bind(i18nJa))).toBe("努力値がまだ 10 余っています");
    expect(formatLintIssue(issue, i18nEn.t.bind(i18nEn))).toBe("Has 10 remaining EVs");
  });

  it("非効率な努力値配分 (suboptimalEvs) を性格名付きで正しくローカライズする", () => {
    const issue: LintIssue = {
      target: "status",
      severity: "warning",
      source: suboptimalEvs("Superior alternative available", {
        natureKey: "adamant",
        natureName: "Adamant",
        savedPoints: 4,
      }),
    };

    expect(formatLintIssue(issue, i18nJa.t.bind(i18nJa))).toBe(
      "より効率的な努力値振りがあります。性格をいじっぱりにすると、努力値が4節約できます",
    );
    expect(formatLintIssue(issue, i18nEn.t.bind(i18nEn))).toBe(
      "There is a superior alternative for EV allocation. If you change nature to Adamant, you will save 4 EVs",
    );
  });
});
