// store/auth.ts
import { atom } from "jotai";

// ログイン状態を管理するAtom (null: ロード中, true: ログイン済み, false: 未ログイン確定)
export const isAuthenticatedAtom = atom<boolean | null>(null);
