import { MsgInstantiateContractEncodeObject } from '@cosmjs/cosmwasm-stargate'
import { toUtf8 } from 'cosmwasm'
import { InstantiateMsg } from 'types/injective-cw3'
import { MsgInstantiateContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx'

export const instantiateMultisigTx = async (
  walletAddress: string,
  message: InstantiateMsg,
  executeTx: (msgs: MsgInstantiateContractEncodeObject[]) => Promise<
    | {
      transactionHash: string
    }
    | undefined
  >
): Promise<{ transactionHash: string } | undefined> => {
  let msg: MsgInstantiateContractEncodeObject
  msg = {
    typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
    value: MsgInstantiateContract.fromPartial({
      sender: this.sender,
      admin: this.admin,
      label: this.label,
      code_id: this.code_id,
      msg: toUtf8(JSON.stringify(message)),
      funds: [],
    }),
  }

  return await executeTx([msg])
}
