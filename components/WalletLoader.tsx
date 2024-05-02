import { ReactNode } from 'react'
import { useSigningClient } from 'contexts/cosmwasm'
import Loader from './Loader'
import Link from 'next/link'

function WalletLoader({
  children,
  loading = false,
}: {
  children: ReactNode
  loading?: boolean
}) {
  const {
    walletAddress,
    loading: clientLoading,
    error,
    connectWallet,
  } = useSigningClient()

  if (loading || clientLoading) {
    return (
      <div className="flex justify-center">
        <Loader />
      </div>
    )
  }

  if (walletAddress === '') {
    return (
      <div className="max-w-full flex flex-col gap-8">
        <h1 className="text-4xl font-bold">
          {process.env.NEXT_PUBLIC_SITE_TITLE}
        </h1>
        <p className="text-xl">Provided by the Neptune Foundation</p>

        <Link
          href="https://github.com/CosmWasm/cw-plus/tree/main/packages/cw3"
          passHref
          target="blank"
        >
          <p className="">Supporting the CW3 Spec: MultiSig/Voting Contracts</p>
        </Link>

        <p className="text-xl">
          Get started by installing{' '}
          <a
            className="pl-1 link link-primary link-hover"
            href="https://keplr.app/"
          >
            Keplr wallet
          </a>
        </p>

        <div className="flex flex-wrap items-center justify-center mt-6 w-full">
          <button
            className="p-6 mt-6 text-left border border-secondary hover:border-primary w-96 rounded-xl hover:text-primary focus:text-primary-focus"
            onClick={connectWallet}
          >
            <h3 className="text-2xl font-bold">Connect your wallet &rarr;</h3>
            <p className="mt-4 text-xl">
              Create and manage your multsig by connecting your Keplr wallet.
            </p>
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return <code>{JSON.stringify(error)}</code>
  }

  return <>{children}</>
}

export default WalletLoader
