import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID: z
    .string({
      required_error:
        "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is required. Get a free project ID at https://cloud.walletconnect.com and put it in .env.local.",
    })
    .min(1, "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID must not be empty")
    .refine(
      (v) => v !== "YOUR_PROJECT_ID",
      "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is still the placeholder 'YOUR_PROJECT_ID'. Replace it with a real WalletConnect project ID.",
    ),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
});

if (!parsed.success) {
  const errors = parsed.error.flatten().fieldErrors;
  const lines = Object.entries(errors)
    .map(([key, msgs]) => `  ${key}: ${msgs?.join("; ")}`)
    .join("\n");
  throw new Error(
    `\n[Drip Wave] Invalid frontend environment configuration:\n${lines}\n\nCopy .env.example to .env.local and fill in the required values.\n`,
  );
}

export const env = parsed.data;
