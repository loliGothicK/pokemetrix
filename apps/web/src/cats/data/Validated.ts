import { mapLeft, type Either } from "fp-ts/Either";

export type Validated<E, A> = Either<readonly E[], A>;

export const toValidated: <E, A>(body: Either<E, A>) => Validated<E, A> = mapLeft((a) => [a]);
