import { Network, getNetworkEndpoints } from "@injectivelabs/networks";
import { MsgExecuteContractCompat, getErrorMessage } from "@injectivelabs/sdk-ts";
import { MsgBroadcaster } from "@injectivelabs/wallet-ts";
import { useSigningClient } from "contexts/cosmwasm";
import { MsgExecuteContractEncodeObject } from "cosmwasm";
import { useCallback } from "react";

const MULTISIG_CODE_ID =
  parseInt(process.env.NEXT_PUBLIC_MULTISIG_CODE_ID as string) || 1

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-1'

const REST_ENDPOINT =
  process.env.NEXT_PUBLIC_REST_ENDPOINT ||
  'https://sentry.lcd.injective.network'

const useExecuteTx = (): ((msgs: MsgExecuteContractEncodeObject[]) => Promise<
  | {
      transactionHash: string;
    }
  | undefined
>) => {
  const { walletAddress, wallet } = useSigningClient()
  const network =
    CHAIN_ID === "injective-888"
      ? Network.Testnet
      : Network.Mainnet;
  const defaultEndpoints = getNetworkEndpoints(network);
  
  const execute = useCallback(
    async (
      msgs: MsgExecuteContractEncodeObject[]
    ): Promise<{ transactionHash: string } | undefined> => {
      if (walletAddress.length === 0) return undefined;
      try {
        if (!wallet) {
          throw new Error("Wallet not connected");
        }

        const broadcaster = new MsgBroadcaster({
          network,
          walletStrategy: wallet,
          endpoints: defaultEndpoints,
        });

        const injMsgs = msgs.map((msg) => {
          return MsgExecuteContractCompat.fromJSON({
            contractAddress: msg.value.contract!,
            sender: msg.value.sender!,
            msg: JSON.parse(Buffer.from(msg.value.msg!).toString("utf-8")),
            funds:
              msg.value.funds && msg.value.funds.length > 0
                ? msg.value.funds
                : undefined,
          });
        });

        const response = await broadcaster.broadcast({
          address: walletAddress,
          msgs: injMsgs,
        });

        return {
          ...response,
          transactionHash: response.txHash,
        };
      } catch (e) {
        console.error(e);
        errorMessageFormatter(e);
      }
      return undefined;
    },
    [defaultEndpoints, network, wallet, walletAddress]
  );

  return execute;
};

const errorMessageFormatter = (e: any) => {
  const msg = getErrorMessage(e, REST_ENDPOINT);
  // if error is insufficient funds, show error message
  if (msg.includes("insufficient funds")) {
    throw new Error(
      `Insufficient funds, check that you have enough to pay for gas fees`
    );
  } else if (msg.includes("one tx is allowed per block")) {
    throw new Error(
      `Only one transaction is allowed per block, please try again in a few seconds`
    );
  } else if (msg.includes("Neptune")) {
    const parts1 = msg.split("Error - ");
    if (parts1.length < 2) throw new Error(msg);
    const parts2 = parts1[1].split(": ");
    if (parts2.length < 2) throw new Error(msg);
    throw new Error(parts2[0]);
  } else if (msg.includes(`Provided chainId "5"`)) {
    throw new Error(`Change your MetaMask network to Goerli`);
  } else {
    throw e;
  }
};

export default useExecuteTx;