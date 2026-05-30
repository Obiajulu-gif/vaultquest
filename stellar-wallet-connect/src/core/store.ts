import { atom } from "nanostores";
import type { NetworkType } from "../lib/wallets.js";

export const connectedPublicKey = atom<string>("");
export const connectedNetwork = atom<NetworkType | null>(null);
export const isNetworkMismatch = atom<boolean>(false);

