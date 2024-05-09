import { MsgInstantiateContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgInstantiateContract } from "@injectivelabs/sdk-ts";
import { MsgExecuteContractEncodeObject } from "cosmwasm";
import { InstantiateQueryClient } from "ts/Instantiate.client";
import { InstantiateMsgComposer } from "ts/Instantiate.message-composer";
import { InstantiateMsg } from "types/injective-cw3";

export const instantiateMultisigTx = async (
  walletAddress: string,
  message: InstantiateMsg,
  executeTx: (msgs: InstantiateMsgComposer[]) => Promise<
    | {
        transactionHash: string;
      }
    | undefined
  >
): Promise<{ transactionHash: string } | undefined> => {
  let msg: InstantiateMsgComposer;
  if (message) {
    const params: InstantiateMsg = {
      sender: message.sender,
      admin: message.admin,
      codeId: message.codeId,
      label: message.label,
      msg: message.msg,
      max_voting_period: {
        time: 0
      },
      threshold: {
        absolute_count: {
          weight: 0
        }
      },
      voters: []
    };
    const msgComposer = new MsgInstantiateContract(
      params
    );
    msg = msgComposer.execute(
      {
        proposalId: message.proposalId,
      },
      message.funds
    );
  }

  return await executeTx([msg]);

};