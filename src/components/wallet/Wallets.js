import React, { useCallback, useMemo } from "react";
import {
  WalletDialogProvider as MaterialUIWalletDialogProvider,
  WalletMultiButton as MaterialUIWalletMultiButton,
} from "@solana/wallet-adapter-material-ui";
import {
  ConnectionProvider,
  useLocalStorage,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getBitpieWallet,
  getCoin98Wallet,
  LedgerWalletAdapter,
  getMathWallet,
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  SolletWalletAdapter,
  getSolongWallet,
  getTorusWallet,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { useSnackbar } from "notistack";

export const Wallets = ({ children }) => {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const network = WalletAdapterNetwork.Mainnet;
  // clusterApiUrl returns a string.
  // const endpoint = useMemo(() => "http://localhost:8899", []);
  const [autoConnect, setAutoConnect] = useLocalStorage("autoConnect", false);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),

      new LedgerWalletAdapter(),
    ],
    []
  );

  const { enqueueSnackbar } = useSnackbar();
  const onError = useCallback(
    (error) => {
      enqueueSnackbar(
        error.message ? `${error.name}: ${error.message}` : error.name,
        {
          variant: "error",
        }
      );
      console.error(error);
    },
    [enqueueSnackbar]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <MaterialUIWalletDialogProvider>
          {children}
        </MaterialUIWalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
