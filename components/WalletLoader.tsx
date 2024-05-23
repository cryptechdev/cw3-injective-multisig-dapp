import { ReactNode } from 'react'
import { useSigningClient } from 'contexts/cosmwasm'
import Loader from './Loader'
import Link from 'next/link'
import Image from 'next/image'

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
        <h1 className="text-5xl font-bold pb-8 cursor-default">
          {process.env.NEXT_PUBLIC_SITE_TITLE}
        </h1>
        <Link href="https://neptunefoundation.xyz/" passHref target="blank">
          <div className="flex flex-col gap-4 p-8 items-center border rounded-lg hover:text-primary focus:text-primary-focus bg-base-200 shadow-lg hover:shadow border-secondary hover:border-primary transition-all duration-300 ease-in-out">
            <Image
              src={'/neptune-foundation-logo.png'}
              height={100}
              width={100}
              alt={'Neptune Foundation Logo'}
            />
            <p className="text-2xl">Provided by the Neptune Foundation</p>
          </div>
        </Link>
        <div className="flex flex-col gap-2 pt-8">
          <Link
            href="https://github.com/InjectiveLabs/cw-plus/tree/dev/contracts/cw3-fixed-multisig"
            passHref
            target="blank"
          >
            <p className="text-xl hover:text-primary focus:text-primary-focus">
              Supporting the CW3 Fixed Spec: MultiSig/Voting Contracts
            </p>
          </Link>
          <p className="text-xl cursor-default">
            Get started by installing{' '}
            <a
              className="pl-1 link link-primary link-hover"
              href="https://keplr.app/"
            >
              Keplr wallet
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center w-full">
          <button
            className="p-6 mt-6 text-left border bg-base-200 shadow-lg hover:shadow border-secondary hover:border-primary w-96 rounded-xl hover:text-primary focus:text-primary-focus transition-all duration-300 ease-in-out"
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
