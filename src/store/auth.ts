// store/authStore.ts
import { atom } from "jotai";

// ログイン状態を管理するAtom
export const isAuthenticatedAtom = atom<boolean>(false);
