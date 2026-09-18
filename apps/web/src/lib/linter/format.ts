import type { TFunction } from "i18next";
import type { LintIssue } from "./linter";
import type { RemainingEvs, SuboptimalEvs, WrongMegaStone } from "./errors/LintError";

/**
 * リンター（解析）が検出した Issue を多言語化された文字列に変換する。
 */
export function formatLintIssue(issue: LintIssue, t: TFunction): string {
  const source = issue.source;
  switch (source._tag) {
    case "lint.warning.noItem":
      return t("teamBuilder.lint.noItem");

    case "lint.warning.wrongMegaStone": {
      const err = source as WrongMegaStone;
      if (err.details?.reason === "cannotMega") {
        return t("teamBuilder.lint.cannotMegaEvolve");
      }
      return t("teamBuilder.lint.wrongMegaStone");
    }

    case "lint.warning.remainingEvs": {
      const err = source as RemainingEvs;
      if (err.details) {
        return t("teamBuilder.lint.remainingEvs", {
          remaining: err.details.remaining,
        });
      }
      return source.message;
    }

    case "lint.warning.suboptimalEvs": {
      const err = source as SuboptimalEvs;
      if (err.details) {
        const localizedNature = err.details.natureKey
          ? t(`natures.${err.details.natureKey}.name`)
          : err.details.natureName;
        return t("teamBuilder.lint.suboptimalEvs", {
          nature: localizedNature,
          savedPoints: err.details.savedPoints,
        });
      }
      return source.message;
    }

    default:
      return source.message;
  }
}
