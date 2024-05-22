import {
  MsgExecuteContract,
  MsgInstantiateContract,
  toUtf8,
} from '@injectivelabs/sdk-ts'
import { ExecuteMsg, InstantiateMsg } from 'types/injective-cw3'

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

export const createProposalTx = async (
  walletAddress: string,
  contract: string,
  message: ExecuteMsg,
  executeTx: (msgs: MsgExecuteContract[]) => Promise<
    | {
        transactionHash: string
      }
    | undefined
  >
): Promise<{ transactionHash: string } | undefined> => {
  let msg: MsgExecuteContract
  console.log('createProposalTx.message', message)
  msg = new MsgExecuteContract({
    sender: walletAddress,
    contractAddress: contract,
    msg: message,
  })
  console.log('createProposalTx.msg', msg)

  return await executeTx([msg])
}
