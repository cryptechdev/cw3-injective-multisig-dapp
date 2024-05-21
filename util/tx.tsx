import { MsgInstantiateContract, toUtf8 } from '@injectivelabs/sdk-ts'
import { InstantiateMsg } from 'types/injective-cw3'

export const instantiateMultisigTx = async (
  walletAddress: string,
  codeId: number,
  chainId: string,
  pubKey: string,
  label: string,
  message: InstantiateMsg,
  executeTx: (msgs: MsgInstantiateContract[]) => Promise<
    | {
        transactionHash: string
      }
    | undefined
  >
): Promise<{ transactionHash: string } | undefined> => {
  let msg: MsgInstantiateContract
  console.log('instantiateMultisigTx.message', message)
  msg = MsgInstantiateContract.fromJSON({
    sender: walletAddress,
    admin: walletAddress,
    codeId: codeId,
    label: label,
    msg: toUtf8(JSON.stringify(message)),
  })
  console.log('instantiateMultisigTx.msg', msg)

  return await executeTx([msg])
}
