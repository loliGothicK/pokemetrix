import { MitamaError } from "@/errors/anyhow/error";

// #[thiserror]
export class ParseError extends MitamaError {
  readonly _tag = "ParseError";
  constructor(
    message: string,
    public readonly meta: {
      name: string;
      raw: string;
    },
    cause?: MitamaError,
  ) {
    super(message, cause);
  }
}

// #[error("Invalid Pokepaste format")]
export const invalidPokepasteFormat = (
  text: string,
  meta: {
    name: string;
    raw: string;
  },
) => new ParseError(text, meta);
