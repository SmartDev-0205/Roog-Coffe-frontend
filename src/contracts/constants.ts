import { PublicKey } from "@solana/web3.js";

export const GLOBAL_STATE_SEED = "GLOBAL_STATE_SEED";
export const VAULT_SEED = "VAULT_SEED";
export const USER_STATE_SEED = "USER_STATE_SEED";
export const TREASURY_WALLET = "33FQ8k8D4VCm4sMv3MYkB3p4Jv23AtMtDwutK8Dhbtww";
// export const TREASURY_WALLET = "Eh8tE3bAZpJjPCZTq32W6RZsscXSjJw2f14MLp85e1PC";
export const TOKEN_ADDRESS = new PublicKey(
  "8ncKVNbZJRsT5fDiCBqHcrvQHKjgtcfNJwgzjehKM5sM"
);
// export const TOKEN_ADDRESS = new PublicKey(
//   "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm"
// );

export const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

// todo: for test, it is now one hour
// export const DAY_IN_MS = 3600 * 1000;
export const DAY_IN_MS = 3600 * 24 * 1000;
export const DAY_IN_SECS = 3600 * 24;
export const HOUR_IN_SECS = 3600;
export const TOKEN_DECIMAL = 1000000000;
// minimum amount to deposit
// should mul 10**decimals here to get real minimum
export const DEPOSIT_MINIMUM_AMOUNT = 100;
// tier starts from 0
export const DEFAULT_MAX_TIER = 2;

export const NETWORK = "devnet";

export const PROGRAM_ID = new PublicKey(
  "8Ui1NUjEW9wT9eXjh6daAM8oJhKpBtXGi7RgjxSPknbF"
);
