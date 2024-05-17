import { useState } from 'react'
import { connectKeplr } from 'services/keplr'
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate'
import {
  CosmosWalletStrategyArguments,
  Wallet,
  WalletStrategy,
  WalletStrategyArguments,
} from '@injectivelabs/wallet-ts'
import { getInjectiveAddress } from '@injectivelabs/sdk-ts'
import { ChainId } from '@injectivelabs/ts-types'

export interface ISigningCosmWasmClientContext {
  walletAddress: string
  signingClient: SigningCosmWasmClient | null
  loading: boolean
  error: any
  connectWallet: any
  wallet: WalletStrategy | null
  disconnect: Function
}

const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-1'
const PUBLIC_RPC_ENDPOINT = process.env.NEXT_PUBLIC_CHAIN_RPC_ENDPOINT || ''
const PUBLIC_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID

export const useSigningCosmWasmClient = (): ISigningCosmWasmClientContext => {
  const [walletAddress, setWalletAddress] = useState('')
  const [wallet, setWallet] = useState<WalletStrategy | null>(null)
  const [signingClient, setSigningClient] =
    useState<SigningCosmWasmClient | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const connectWallet = async () => {
    setLoading(true)

    try {
      const walletArgs:
        | WalletStrategyArguments
        | CosmosWalletStrategyArguments = {
        chainId:
          CHAIN_ID === 'injective-888' ? ChainId.Testnet : ChainId.Mainnet,
        wallet: Wallet.Keplr,
      }

      await connectKeplr()

      // enable website to access kepler
      await (window as any).keplr.enable(PUBLIC_CHAIN_ID)

      // get offline signer for signing txs
      const offlineSigner = await (window as any).getOfflineSigner(
        PUBLIC_CHAIN_ID
      )

      // make client
      const client = await SigningCosmWasmClient.connectWithSigner(
        PUBLIC_RPC_ENDPOINT,
        offlineSigner
      )
      setSigningClient(client)

      // get user address
      const [{ address }] = await offlineSigner.getAccounts()
      setWalletAddress(address)

      setLoading(false)
    } catch (error) {
      setError(error as any)
    }
  }

  const disconnect = () => {
    if (signingClient) {
      signingClient.disconnect()
    }
    setWalletAddress('')
    setSigningClient(null)
    setLoading(false)
  }

  return {
    walletAddress,
    signingClient,
    loading,
    error,
    connectWallet,
    wallet,
    disconnect,
  }
}
