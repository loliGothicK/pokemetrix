import { TrainedPokemon } from "@/store/team/team";
import { MitamaError } from "@/errors/anyhow/error";
import { checkSuboptimalEVs } from "@/lib/linter/rules/status/suboptimalEvs";
import { Option } from "fp-ts/Option";
import { option } from "fp-ts";
import { transposeArray } from "@/cats/syntax/Validated";
import { pipe } from "fp-ts/function";
import { checkRemainingEVs } from "@/lib/linter/rules/status/remainigEvs";
import { checkWrongMegaStone } from "@/lib/linter/rules/item/wrongMegaStone";
import { checkNoItem } from "@/lib/linter/rules/item/noItem";

export type LintIssue = {
  readonly target: "status" | "item" | "moves";
  readonly severity: "error" | "warning";
  readonly source: MitamaError;
};

export type LintResult = {
  readonly status: readonly LintIssue[];
  readonly item: readonly LintIssue[];
  readonly moves: readonly LintIssue[];
};

const intoIssue =
  (settings: Omit<LintIssue, "source">) =>
  (source: MitamaError): LintIssue => {
    return {
      ...settings,
      source,
    };
  };

const lint =
  (target: "status" | "item" | "moves") =>
  (rules: {
    readonly warnings?: readonly ((member: TrainedPokemon) => Option<MitamaError>)[];
    readonly errors?: readonly ((member: TrainedPokemon) => Option<MitamaError>)[];
  }) =>
  (member: TrainedPokemon | null): readonly LintIssue[] => {
    if (!member) {
      return [];
    }

    const warnings = pipe(
      rules?.warnings,
      option.fromNullable,
      option.flatMap((rules) =>
        pipe(
          rules.map((rule) =>
            pipe(
              rule(member),
              option.map(
                intoIssue({
                  target,
                  severity: "warning",
                }),
              ),
            ),
          ),
          transposeArray,
        ),
      ),
    );

    const errors = pipe(
      rules?.errors,
      option.fromNullable,
      option.flatMap((rules) =>
        pipe(
          rules.map((rule) =>
            pipe(
              rule(member),
              option.map(
                intoIssue({
                  target,
                  severity: "warning",
                }),
              ),
            ),
          ),
          transposeArray,
        ),
      ),
    );

    return pipe(
      transposeArray([warnings, errors]),
      option.map((issues) => issues.flat()),
      option.getOrElse<readonly LintIssue[]>(() => []),
    );
  };

export const linter = (member: TrainedPokemon | null): LintResult => {
  return {
    status: lint("status")({
      warnings: [checkSuboptimalEVs],
      errors: [checkRemainingEVs],
    })(member),
    item: lint("item")({
      warnings: [checkWrongMegaStone, checkNoItem],
      errors: [],
    })(member),
    moves: lint("moves")({
      warnings: [],
      errors: [],
    })(member),
  };
};
