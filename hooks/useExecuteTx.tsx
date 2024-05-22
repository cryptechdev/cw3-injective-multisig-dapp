import { Network, getNetworkEndpoints } from '@injectivelabs/networks'
import {
  MsgExecuteContract,
  MsgInstantiateContract,
  getErrorMessage,
} from '@injectivelabs/sdk-ts'
import {
  MsgBroadcaster,
  Wallet,
  WalletStrategy,
} from '@injectivelabs/wallet-ts'
import { useSigningClient } from 'contexts/cosmwasm'
import { useCallback, useMemo } from 'react'
import { ChainId } from '@injectivelabs/ts-types'

const MULTISIG_CODE_ID =
  parseInt(process.env.NEXT_PUBLIC_MULTISIG_CODE_ID as string) || 1

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-1'

const REST_ENDPOINT =
  process.env.NEXT_PUBLIC_REST_ENDPOINT ||
  'https://sentry.lcd.injective.network'

const useExecuteInstantiateTx = (): ((
  msgs: MsgInstantiateContract[]
) => Promise<
  | {
      transactionHash: string
    }
  | undefined
>) => {
  const { walletAddress } = useSigningClient()
  const network =
    CHAIN_ID === 'injective-888' ? Network.Testnet : Network.Mainnet
  const defaultEndpoints = getNetworkEndpoints(network)

  const walletArgs = useMemo(() => {
    return {
      chainId: CHAIN_ID === 'injective-888' ? ChainId.Testnet : ChainId.Mainnet,
      wallet: Wallet.Keplr,
    }
  }, [])

  const execute = useCallback(
    async (
      msgs: MsgInstantiateContract[]
    ): Promise<{ transactionHash: string } | undefined> => {
      console.log('useExecuteInstantiateTx.address', walletAddress)
      console.log('useExecuteInstantiateTx.network', network)
      console.log('useExecuteInstantiateTx.wallet', walletArgs.wallet)
      if (walletAddress.length === 0) return undefined
      try {
        const broadcaster = new MsgBroadcaster({
          network,
          walletStrategy: new WalletStrategy(walletArgs),
          endpoints: defaultEndpoints,
        })

        console.log('useExecuteInstantiateTx.msgs', msgs)

        console.log('useExecuteInstantiateTx.broadcaster', broadcaster)

        const injMsgs = msgs.map((msg) => {
          console.log('useExecuteTx.msg', msg)
          return MsgInstantiateContract.fromJSON({
            sender: msg.params.sender ?? '',
            admin: msg.params.admin ?? '',
            codeId: MULTISIG_CODE_ID,
            label: msg.params.label ?? '',
            msg:
              JSON.parse(
                Buffer.from(msg.params.msg as Uint8Array).toString('utf-8')
              ) ?? '',
          })
        })

        console.log('useExecuteInstantiateTx.injMsgs', injMsgs)

        const response = await broadcaster.broadcast({
          address: walletAddress,
          msgs: injMsgs,
        })

        console.log('useExecuteInstantiateTx.response', response)

        return {
          ...response,
          transactionHash: response.txHash,
        }
      } catch (e) {
        console.error(e)
        errorMessageFormatter(e)
      }
      return undefined
    },
    [defaultEndpoints, network, walletArgs, walletAddress]
  )

  return execute
}

export const useExecuteProposalTx = (): ((
  msgs: MsgExecuteContract[]
) => Promise<
  | {
      transactionHash: string
    }
  | undefined
>) => {
  const { walletAddress } = useSigningClient()
  const network =
    CHAIN_ID === 'injective-888' ? Network.Testnet : Network.Mainnet
  const defaultEndpoints = getNetworkEndpoints(network)

  const walletArgs = useMemo(() => {
    return {
      chainId: CHAIN_ID === 'injective-888' ? ChainId.Testnet : ChainId.Mainnet,
      wallet: Wallet.Keplr,
    }
  }, [])

  const execute = useCallback(
    async (
      msgs: MsgExecuteContract[]
    ): Promise<{ transactionHash: string } | undefined> => {
      console.log('useExecuteProposalTx.address', walletAddress)
      console.log('useExecuteProposalTx.network', network)
      console.log('useExecuteProposalTx.wallet', walletArgs.wallet)
      if (walletAddress.length === 0) return undefined
      try {
        const broadcaster = new MsgBroadcaster({
          network,
          walletStrategy: new WalletStrategy(walletArgs),
          endpoints: defaultEndpoints,
        })

        console.log('useExecuteProposalTx.msgs', msgs)

        console.log('useExecuteProposalTx.broadcaster', broadcaster)

        const injMsgs = msgs.map((msg) => {
          console.log('useExecuteProposalTx.msg', msg)
          const msgString = JSON.stringify(msg.params.msg)
          console.log('useExecuteProposalTx.msgString', msgString)
          return MsgExecuteContract.fromJSON({
            sender: msg.params.sender ?? '',
            contractAddress: msg.params.contractAddress ?? '',
            msg: msg.params.msg,
            funds: msg.params.funds ?? [],
          })
        })

        console.log('useExecuteProposalTx.injMsgs', injMsgs)

        const response = await broadcaster.broadcast({
          address: walletAddress,
          msgs: injMsgs,
        })

        console.log('useExecuteProposalTx.response', response)

        return {
          ...response,
          transactionHash: response.txHash,
        }
      } catch (e) {
        console.error(e)
        errorMessageFormatter(e)
      }
      return undefined
    },
    [defaultEndpoints, network, walletArgs, walletAddress]
  )

  return execute
}

const errorMessageFormatter = (e: any) => {
  const msg = getErrorMessage(e, REST_ENDPOINT)
  // if error is insufficient funds, show error message
  if (msg.includes('insufficient funds')) {
    throw new Error(
      `Insufficient funds, check that you have enough to pay for gas fees`
    )
  } else if (msg.includes('one tx is allowed per block')) {
    throw new Error(
      `Only one transaction is allowed per block, please try again in a few seconds`
    )
  } else if (msg.includes(`Provided chainId "5"`)) {
    throw new Error(`Change your MetaMask network to Goerli`)
  } else {
    throw e
  }
}

export default useExecuteInstantiateTx
