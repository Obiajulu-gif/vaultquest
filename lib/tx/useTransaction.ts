import { useState } from "react";

export type TxState =
  | "idle"
  | "preparing"
  | "signing"
  | "submitting"
  | "pending"
  | "success"
  | "failed"
  | "rejected";

interface UseTransactionResult {
  state: TxState;
  execute: (txBuilder: () => Promise<any>) => Promise<void>;
}

export function useTransaction(): UseTransactionResult {
  const [state, setState] = useState<TxState>("idle");

  async function execute(txBuilder: () => Promise<any>) {
    if (state !== "idle") return;
    try {
      setState("preparing");
      const tx = await txBuilder();
      setState("signing");
      // Replace with your wallet integration
      const signed = await window.wallet.sign(tx);
      setState("submitting");
      // Replace with your tx submission logic
      const hash = await window.submitTx(signed);
      setState("pending");
      // Replace with your confirmation logic
      await window.waitForConfirmation(hash);
      setState("success");
    } catch (err: any) {
      if (err?.code === "USER_REJECTED") {
        setState("rejected");
      } else {
        setState("failed");
      }
    }
  }

  return { state, execute };
}
