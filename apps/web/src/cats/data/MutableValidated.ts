import { mapLeft, type Either } from "fp-ts/Either";

export type MutableValidated<E, A> = Either<E[], A>;

export const toMutableValidated: <E, A>(body: Either<E, A>) => MutableValidated<E, A> = mapLeft(
  (a) => [a],
);
