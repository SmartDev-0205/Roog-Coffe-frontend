/* eslint-disable react-hooks/exhaustive-deps */
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/system";
import { PublicKey } from "@solana/web3.js";

import { useLocation } from "react-router-dom";
import { useContractContext } from "../../providers/ContractProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import PriceInput from "../../components/PriceInput";
import { useEffect, useState } from "react";
import {
  buyRoogs,
  sellRoogs,
  hatchRoogs,
  initialize,
} from "../../contracts/bean";
import { TREASURY_WALLET } from "../../contracts/constants";

import {
  getWalletSolBalance,
  getVaultSolBalance,
  getUserData,
  getGlobalStateData,
  getWalletTokenBalance,
} from "../../contracts/bean";

const CardWrapper = styled(Card)({
  background: "transparent",
  marginBottom: 24,
  border: "5px solid #555",
});

const ButtonContainer = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    "> div": {
      marginLeft: 0,
      marginRight: 0,
    },
  },
}));

const UnderlinedGrid = styled(Grid)(() => ({
  borderBottom: "1px solid black",
}));

export default function BakeCard() {
  function useQuery() {
    return new URLSearchParams(useLocation().search);
  }
  /*const { address, chainId } = useAuthContext();*/
  const { publicKey: address } = useWallet();
  const [bakeSOL, setBakeSOL] = useState(0);
  const [loading, setLoading] = useState(false);

  const query = useQuery();
  const wallet = useWallet();

  const [minersCount, setMinersCount] = useState("0");
  const [beanRewards, setBeanRewards] = useState("0");
  const [walletSolBalance, setWalletSolBalance] = useState("0");
  const [contractSolBalance, setContractSolBalance] = useState("0");
  const [dataUpdate, setDataUpdate] = useState(false);
  const [adminKey, setAdminKey] = useState(null);
  const [isTreasuryWallet, setIsTreasuryWallet] = useState(true);

  useEffect(() => {
    if (wallet.publicKey && wallet.publicKey.toString() == TREASURY_WALLET) {

      getGlobalStateData(wallet).then((data) => {
        if (data != null) {
          if (data.isInitialized == 0) {
            setIsTreasuryWallet(false);
          }
        }
      });

      
    }
  }, [wallet]);

  useEffect(() => {
    try {
      getWalletSolBalance(wallet).then((bal) => {
        console.log("getWalletSolBalance bal=", bal);
        setWalletSolBalance(bal);
      });
      getUserData(wallet).then((data) => {
        if (data !== null) {
          console.log("userData =", data);
          setBeanRewards(data.beanRewards);
          setMinersCount(data.miners);
        } else {
          setBeanRewards("0");
          setMinersCount("0");
        }
      });
      getGlobalStateData(wallet).then((data) => {
        if (data != null) {
          setAdminKey(data.authority);
        }
      });
    } catch (err) {
      console.log("error");
    }
  }, [wallet, dataUpdate]);

  useEffect(() => {
    getVaultSolBalance(wallet).then((bal) => {
      setContractSolBalance(bal);
    });
  }, [wallet, dataUpdate]);

  useEffect(() => {
    setTimeout(() => {
      if (wallet.publicKey) toggleDataUpdate();
    }, 5000);
  });

  const toggleDataUpdate = () => {
    setDataUpdate(!dataUpdate);
  };

  const onUpdateBakeSOL = (value) => {
    setBakeSOL(value);
  };
  const getRef = () => {
    const ref = query.get("ref");
    if (ref === null) return null;
    return new PublicKey(ref);
  };

  const initializeProgram = async () => {
    setLoading(true);
    try {
      await initialize(wallet);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    toggleDataUpdate();
  };

  const bake = async () => {
    setLoading(true);

    let ref = getRef();
    console.log("bake: ref=", ref);
    if (ref === null) ref = wallet.publicKey;
    try {
      await buyRoogs(wallet, ref, bakeSOL);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    toggleDataUpdate();
  };

  const reBake = async () => {
    setLoading(true);

    let ref = getRef();

    if (ref === null) ref = wallet.publicKey;
    try {
      await hatchRoogs(wallet, ref);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    toggleDataUpdate();
  };

  const eatBeans = async () => {
    setLoading(true);

    try {
      await sellRoogs(wallet);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
    toggleDataUpdate();
  };

  return (
    <CardWrapper>
      {loading && <LinearProgress color="secondary" />}
      <CardContent>
        <UnderlinedGrid
          container
          justifyContent="space-between"
          alignItems="center"
          mt={3}
        >
          <Typography variant="body1">Contract</Typography>
          <Typography variant="h5">
            {parseFloat(contractSolBalance).toFixed(4)} DogWifhat
          </Typography>
        </UnderlinedGrid>
        <UnderlinedGrid
          container
          justifyContent="space-between"
          alignItems="center"
          mt={3}
        >
          <Typography variant="body1">Wallet</Typography>
          <Typography variant="h5">
            {parseFloat(walletSolBalance).toFixed(4)} DogWifhat
          </Typography>
        </UnderlinedGrid>
        <UnderlinedGrid
          container
          justifyContent="space-between"
          alignItems="center"
          mt={3}
        >
          <Typography variant="body1">Your Shares</Typography>
          <Typography variant="h5">{minersCount} Shares</Typography>
        </UnderlinedGrid>
        <Box paddingTop={4} paddingBottom={3}>
          <Box>
            <PriceInput
              max={+walletSolBalance}
              value={bakeSOL}
              onChange={(value) => onUpdateBakeSOL(value)}
            />
          </Box>

          <Box marginTop={3} marginBottom={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={initializeProgram}
              hidden={isTreasuryWallet}
              className="custom-button"
            >
              Init
            </Button>
          </Box>

          <Box marginTop={3} marginBottom={3}>
            <Button
              variant="contained"
              fullWidth
              disabled={!address || +bakeSOL === 0 || loading}
              onClick={bake}
              className="custom-button"
            >
              Buy Shares
            </Button>
          </Box>
          <Divider />
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            mt={3}
          >
            <Typography variant="body1" fontWeight="bolder">
              Your Rewards
            </Typography>
            <Typography variant="h5" fontWeight="bolder">
              {parseFloat(beanRewards).toFixed(4)} DogWifhat
            </Typography>
          </Grid>
          <ButtonContainer container>
            <Grid item flexGrow={1} marginRight={1} marginTop={3}>
              <Button
                variant="contained"
                fullWidth
                disabled={!address || loading}
                onClick={reBake}
                className="custom-button"
              >
                Compound
              </Button>
            </Grid>
            <Grid item flexGrow={1} marginLeft={1} marginTop={3}>
              <Button
                variant="contained"
                fullWidth
                disabled={!address || loading}
                onClick={eatBeans}
                className="custom-button"
              >
                withdraw
              </Button>
            </Grid>
          </ButtonContainer>
        </Box>
      </CardContent>
    </CardWrapper>
  );
}
