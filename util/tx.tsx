import { MsgInstantiateContractEncodeObject } from '@cosmjs/cosmwasm-stargate'
import { toUtf8 } from 'cosmwasm'
import { InstantiateMsg } from 'types/injective-cw3'
import { MsgInstantiateContract } from 'cosmjs-types/cosmwasm/wasm/v1/tx'

export const instantiateMultisigTx = async (
  walletAddress: string,
  codeId: number,
  chainId: string,
  pubKey: string,
  label: string,
  message: InstantiateMsg,
  executeTx: (msgs: MsgInstantiateContractEncodeObject[]) => Promise<
    | {
        transactionHash: string
      }
    | undefined
  >
): Promise<{ transactionHash: string } | undefined> => {
  let msg: MsgInstantiateContractEncodeObject
  console.log('instantiateMultisigTx', message)
  msg = {
    typeUrl: '/cosmwasm.wasm.v1.MsgInstantiateContract',
    value: MsgInstantiateContract.fromPartial({
      sender: walletAddress,
      admin: walletAddress,
      label: label,
      code_id: codeId as never,
      msg: toUtf8(JSON.stringify(message)),
      funds: [],
    }),
  }
  console.log('instantiateMultisigTxMsg', msg)

  return await executeTx([msg])
}
