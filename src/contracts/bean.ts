import * as anchor from "@project-serum/anchor";
import { BN } from "@project-serum/anchor";
import {
  PublicKey,
  Keypair,
  Connection,
  Transaction,
  clusterApiUrl,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionSignature,
  TransactionInstruction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

import { BigNumber } from "bignumber.js";

import { WalletContextState } from "@solana/wallet-adapter-react";

import * as Constants from "./constants";
import { IDL } from "./idl";
import { showToast } from "./utils";
import { toast } from "react-toastify";
import * as keys from "./keys";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import bs58 from "bs58";

// const connection = new Connection(
//   "https://black-alien-film.solana-mainnet.quiknode.pro/3673e3ab1fc70a84f976170132c8e6daf34b317d/"
// );
const connection = new Connection(
  "https://api.devnet.solana.com"
);

export const getProgram = (wallet: any) => {

  // const secretKeyArray = [158,228,253,31,58,36,67,6,37,107,191,20,27,144,231,83,241,63,54,144,217,27,138,220,152,156,130,143,45,179,148,229,42,117,80,100,142,220,216,214,219,54,196,214,56,85,0,77,210,52,19,39,243,39,243,130,12,102,27,85,73,125,205,90,91,140];

//  const secretKeyArray = [41,251,42,62,92,135,194,196,166,90,10,99,5,198,230,26,120,57,106,137,187,4,204,237,56,37,160,39,189,245,160,137,30,74,208,249,118,242,251,249,124,26,32,54,71,144,230,191,251,122,72,192,114,146,45,202,93,11,141,154,41,111,189,174];

//   // Convert the array to a Uint8Array
//   const secretKeyUint8Array = Uint8Array.from(secretKeyArray);
//   console.log(secretKeyUint8Array,"***********************")
//   // Initialize the Keypair from the secret key
//   const keypair = Keypair.fromSecretKey(secretKeyUint8Array);
  
//   // Get the private key
//   const privateKey = keypair.secretKey;
//   console.log(privateKey);
//   const privateKeyBase58 = bs58.encode(privateKey);
//   console.log('Private Key (Base58):', privateKeyBase58);



  
  let provider = new anchor.Provider(
    connection,
    wallet,
    anchor.Provider.defaultOptions()
  );
  const program = new anchor.Program(IDL, Constants.PROGRAM_ID, provider);
  return program;
};

export const getGlobalStateData = async (wallet: any) => {
  const program = getProgram(wallet);
  try {
    const globalStateKey = await keys.getGlobalStateKey();
    const stateData = await program.account.globalState.fetchNullable(
      globalStateKey
    );
    if (stateData === null) return null;
    return stateData;
  } catch {
    return null;
  }
};

export const getWalletSolBalance = async (wallet: any): Promise<String> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined) return "0";
  const token = await getTokenBalance(
    await getAssociatedTokenAccount(wallet.publicKey),
    true
  );
  return token;
};

export const getWalletTokenBalance = async (
  wallet: any,
  tokenMintAddress: string
): Promise<string> => {
  if (!wallet.publicKey) return "0";

  const tokenMintPublicKey = new PublicKey(tokenMintAddress);
  const walletPublicKey = new PublicKey(wallet.publicKey);

  try {
    const response = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { mint: tokenMintPublicKey }
    );

    let balance = new BigNumber(0);
    for (const account of response.value) {
      const accountInfo = account.account.data.parsed.info;
      if (accountInfo.mint === tokenMintAddress) {
        balance = balance.plus(
          new BigNumber(accountInfo.tokenAmount.amount).div(
            10 ** accountInfo.tokenAmount.decimals
          )
        );
      }
    }

    console.log("Token balance:", balance.toString());
    return balance.toString();
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return "0";
  }
};

export const getVaultSolBalance = async (wallet: any): Promise<String> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined) return "0";
  const vaultKey = await keys.getVaultKey();
  const token = await getTokenBalance(vaultKey, true);
  return token;
};

export const getUserData = async (wallet: any): Promise<any> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined) return null;
  console.log("getUserData");
  try {
    const program = getProgram(wallet);

    // const vaultBal = (await getVaultSolBalance(wallet)).toString();
    // const vaultKey = await keys.getVaultKey();
    // const vaultBal = await connection.getBalance(vaultKey);
    const vaultKey = await keys.getVaultKey();
    const vaultBal = (await getTokenBalance(vaultKey, false)).toString();
    // console.log("vaultBal: ", vaultBal)

    let userStateKey = await keys.getUserStateKey(wallet.publicKey);

    const stateData = await program.account.userState.fetchNullable(
      userStateKey
    );
    if (stateData === null) return null;

    const globalStateKey = await keys.getGlobalStateKey();
    const globalData = await program.account.globalState.fetchNullable(
      globalStateKey
    );
    if (globalData === null) return null;
    // getRoogsSinceLastHatch
    let secondsPassed = Math.min(
      globalData.roogsPerMiner.toNumber(),
      Date.now() / 1000 - stateData.lastHatchTime.toNumber()
    );
    console.log(
      "stateData.claimedRoogs.toNumber() =",
      stateData.claimedRoogs.toNumber()
    );
    console.log("secondsPassed =", secondsPassed);
    console.log("userStateKey =", userStateKey.toBase58());
    console.log("stateData =", stateData);
    console.log("stateData.user =", stateData.user.toBase58());
    console.log("stateData.miners =", stateData.miners.toNumber());
    let myRoogs = stateData.claimedRoogs.add(
      new BN(secondsPassed).mul(stateData.miners)
    );
    console.log("myRoogs =", myRoogs.toNumber());
    console.log("globalData.marketRoogs =", globalData.marketRoogs.toNumber());
    console.log("new BN(vaultBal) =", new BN(vaultBal).toNumber());
    let beanRewards = calculateTrade(
      myRoogs,
      globalData.marketRoogs,
      new BN(vaultBal),
      globalData.psn,
      globalData.psnh
    );

    return {
      miners: stateData.miners.toString(),
      beanRewards: new BigNumber(beanRewards.toString())
        .div(LAMPORTS_PER_SOL)
        .toString(),
    };
  } catch {
    return null;
  }
};
function calculateTrade(rt: BN, rs: BN, bs: BN, PSN: BN, PSNH: BN) {
  if (rt.toString() === "0") return new BN(0);
  console.log("calcTrade");
  console.log(rt.toString());
  console.log(rs.toString());
  console.log(bs.toString());
  console.log(PSN.toString());
  console.log(PSNH.toString());
  let x = PSN.mul(bs);
  let y = PSNH.add(PSN.mul(rs).add(PSNH.mul(rt)).div(rt));
  console.log("calcTrade");
  console.log(x.toString());
  console.log(y.toString());
  return x.div(y);
}

async function getTokenBalance(
  tokenAccount: any,
  isUi: boolean
): Promise<String> {
  if (!tokenAccount) return "0";
  const response = await connection.getAccountInfo(tokenAccount);
  if (!response) return "0";
  const info = await connection.getTokenAccountBalance(tokenAccount);
  if (isUi) {
    if (!info.value.uiAmountString) return "0";
    return info.value.uiAmountString;
  } else {
    if (!info.value.amount) return "0";
    return info.value.amount;
  }
}

const getAssociatedTokenAccount = async (
  ownerPubkey: PublicKey
): Promise<PublicKey> => {
  let associatedTokenAccountPubkey = (
    await PublicKey.findProgramAddress(
      [
        ownerPubkey.toBuffer(),
        Constants.TOKEN_PROGRAM_ID.toBuffer(),
        Constants.TOKEN_ADDRESS.toBuffer(), // mint address
      ],
      Constants.ASSOCIATED_TOKEN_PROGRAM_ID
    )
  )[0];
  return associatedTokenAccountPubkey;
};

export const initialize = async (
  wallet: WalletContextState
): Promise<string | null> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined)
    throw new WalletNotConnectedError();

  const program = getProgram(wallet);
  const tx = new Transaction().add(
    await program.methods
      .initialize(wallet.publicKey)
      .accounts({
        authority: wallet.publicKey,
        globalState: await keys.getGlobalStateKey(),
        treasury: await getAssociatedTokenAccount(wallet.publicKey),
        vault: await keys.getVaultKey(),
        mint: Constants.TOKEN_ADDRESS,
        tokenProgram: Constants.TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction()
  );
  return await send(connection, wallet, tx);
};

export const buyRoogs = async (
  wallet: WalletContextState,
  referralKey: PublicKey,
  tokenAmount: number
): Promise<string | null> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined)
    throw new WalletNotConnectedError();

  const program = getProgram(wallet);
  let globalStateKey = await keys.getGlobalStateKey();

  let globalData = await program.account.globalState.fetch(globalStateKey);
  let vaultKey = await keys.getVaultKey();
  let buyIx = await program.methods
    .buyRoogs(new anchor.BN(tokenAmount * Constants.TOKEN_DECIMAL))
    .accounts({
      user: wallet.publicKey,
      globalState: globalStateKey,
      treasury: globalData.treasury,
      vault: vaultKey,
      mint: Constants.TOKEN_ADDRESS,
      userState: await keys.getUserStateKey(wallet.publicKey),
      account: await getAssociatedTokenAccount(wallet.publicKey),
      tokenProgram: Constants.TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();

  let hatchIx = await getHatchIx(program, wallet.publicKey, referralKey);
  let tx = new Transaction();
  tx.add(buyIx);
  tx.add(hatchIx);
  return await send(connection, wallet, tx);
};

export const getHatchIx = async (
  program: any,
  userKey: PublicKey,
  referralKey: PublicKey
): Promise<TransactionInstruction> => {
  let r = referralKey;
  if (referralKey.equals(userKey)) {
    let globalStateKey = await keys.getGlobalStateKey();
    let globalData = await program.account.globalState.fetch(globalStateKey);
    r = globalData.treasury;
  }
  let ix = await program.methods
    .hatchRoogs()
    .accounts({
      user: userKey,
      globalState: await keys.getGlobalStateKey(),
      userState: await keys.getUserStateKey(userKey),
      referral: r,
      referralState: await keys.getUserStateKey(r),
      SystemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .instruction();
  return ix;
};

export const hatchRoogs = async (
  wallet: WalletContextState,
  referralKey: PublicKey
): Promise<string | null> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined)
    throw new WalletNotConnectedError();

  const program = getProgram(wallet);
  const tx = new Transaction().add(
    await getHatchIx(program, wallet.publicKey, referralKey)
  );
  return await send(connection, wallet, tx);
};

export const sellRoogs = async (
  wallet: WalletContextState
): Promise<string | null> => {
  if (wallet.publicKey === null || wallet.publicKey === undefined)
    throw new WalletNotConnectedError();

  const program = getProgram(wallet);
  let globalStateKey = await keys.getGlobalStateKey();
  let globalData = await program.account.globalState.fetch(globalStateKey);
  let vaultKey = await keys.getVaultKey();
  const tx = new Transaction().add(
    await program.methods
      .sellRoogs()
      .accounts({
        user: wallet.publicKey,
        globalState: globalStateKey,
        treasury: globalData.treasury,
        vault: vaultKey,
        mint: Constants.TOKEN_ADDRESS,
        userState: await keys.getUserStateKey(wallet.publicKey),
        account: await getAssociatedTokenAccount(wallet.publicKey),
        tokenProgram: Constants.TOKEN_PROGRAM_ID,
      })
      .instruction()
  );
  return await send(connection, wallet, tx);
};

async function send(
  connection: Connection,
  wallet: WalletContextState,
  transaction: Transaction
) {
  const txHash = await sendTransaction(connection, wallet, transaction);
  if (txHash != null) {
    let confirming_id = showToast("Confirming Transaction ...", -1, 2);
    let res = await connection.confirmTransaction(txHash);
    console.log(txHash);
    toast.dismiss(confirming_id);
    if (res.value.err) showToast("Transaction Failed", 2000, 1);
    else showToast("Transaction Confirmed", 2000);
  } else {
    showToast("Transaction Failed", 2000, 1);
  }
  return txHash;
}

export async function sendTransaction(
  connection: Connection,
  wallet: WalletContextState,
  transaction: Transaction
) {
  if (wallet.publicKey === null || wallet.signTransaction === undefined)
    return null;
  try {
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash;
    transaction.feePayer = wallet.publicKey;
    const signedTransaction = await wallet.signTransaction(transaction);
    const rawTransaction = signedTransaction.serialize();

    showToast("Sending Transaction ...", 500);
    // notify({
    //   message: "Transaction",
    //   description: "Sending Transaction ...",
    //   duration: 0.5,
    // });

    const txid: TransactionSignature = await connection.sendRawTransaction(
      rawTransaction,
      {
        skipPreflight: true,
        preflightCommitment: "processed",
      }
    );
    return txid;
  } catch (e) {
    console.log("tx e = ", e);
    return null;
  }
}
