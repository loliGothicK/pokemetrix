import { MitamaError } from "@/errors/anyhow/error";

// #[thiserror]
export class LintError extends MitamaError {
  readonly _tag = "lint.error";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

// #[thiserror]
export class LintWarning extends MitamaError {
  readonly _tag = "lint.warning";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const lintError = (text: string, cause?: MitamaError) => new LintError(text, cause);
export const lintWarning = (text: string, cause?: MitamaError) => new LintWarning(text, cause);

export interface SuboptimalEvsDetails {
  readonly natureKey?: string;
  readonly natureName: string;
  readonly savedPoints: number;
}

export class SuboptimalEvs extends MitamaError {
  readonly _tag = "lint.warning.suboptimalEvs";
  readonly details?: SuboptimalEvsDetails;
  constructor(message: string, details?: SuboptimalEvsDetails, cause?: MitamaError) {
    super(message, cause);
    this.details = details;
  }
}

export const suboptimalEvs = (text: string, details?: SuboptimalEvsDetails, cause?: MitamaError) =>
  new SuboptimalEvs(text, details, cause);

export interface RemainingEvsDetails {
  readonly identifier: string;
  readonly remaining: number;
}

export class RemainingEvs extends MitamaError {
  readonly _tag = "lint.warning.remainingEvs";
  readonly details?: RemainingEvsDetails;
  constructor(message: string, details?: RemainingEvsDetails, cause?: MitamaError) {
    super(message, cause);
    this.details = details;
  }
}

export const remainingEvs = (text: string, details?: RemainingEvsDetails, cause?: MitamaError) =>
  new RemainingEvs(text, details, cause);

export interface WrongMegaStoneDetails {
  readonly reason: "cannotMega" | "wrongStone";
}

export class WrongMegaStone extends MitamaError {
  readonly _tag = "lint.warning.wrongMegaStone";
  readonly details?: WrongMegaStoneDetails;
  constructor(message: string, details?: WrongMegaStoneDetails, cause?: MitamaError) {
    super(message, cause);
    this.details = details;
  }
}

export const wrongMegaStone = (
  text: string,
  details?: WrongMegaStoneDetails,
  cause?: MitamaError,
) => new WrongMegaStone(text, details, cause);

export class NoItem extends MitamaError {
  readonly _tag = "lint.warning.noItem";
  constructor(message: string, cause?: MitamaError) {
    super(message, cause);
  }
}

export const noItem = (text: string, cause?: MitamaError) => new NoItem(text, cause);
