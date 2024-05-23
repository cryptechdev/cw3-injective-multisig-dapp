import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import WalletLoader from 'components/WalletLoader'

type AddressObj = {
  address: string
  label: string
}

const Home: NextPage = () => {
  const router = useRouter()
  const [address, setAddress] = useState('')
  const [storedAddresses, setStoredAddresses] = useState<AddressObj[]>([])

  useEffect(() => {
    // Check if window is defined to ensure we are on the client side
    if (typeof window !== 'undefined') {
      const addresses =
        JSON.parse(localStorage.getItem('multisigAddresses')!) || []
      setStoredAddresses(addresses)
    }
  }, [])

  return (
    <WalletLoader>
      <div className="flex flex-col w-full">
        <div className="grid bg-base-100 place-items-center">
          <h1 className="text-4xl font-bold mb-8 cursor-default">Existing</h1>
          <div className="flex w-full max-w-xl xl:max-w-2xl">
            <div className="relative rounded-xl shadow-sm w-full">
              <input
                id="multisig-address"
                className="input input-bordered focus:input-primary input-lg w-full pr-24 rounded-xl text-center font-mono text-lg"
                placeholder="Multisig contract address..."
                step="0.1"
                value={address}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    router.push(`/${event.currentTarget.value}`)
                  }
                }}
                onChange={(event) => setAddress(event.target.value)}
              />
              <button
                className="absolute top-0 right-0 bottom-0 px-8 py-5 rounded-r-xl bg-primary text-base-100 text-xl"
                onClick={() => {
                  const inputEl = document.getElementById(
                    'multisig-address'
                  ) as HTMLInputElement
                  router.push(`/${inputEl.value}`)
                }}
              >
                GO
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4 pt-8">
            {storedAddresses.map((addressObj: AddressObj) => (
              <button
                key={addressObj.address}
                className="btn btn-primary btn-md font-semibold hover:text-base-100 text-xl rounded-xl w-full"
                onClick={() => router.push(`/${addressObj.address}`)}
              >
                {addressObj.label}
              </button>
            ))}
          </div>
        </div>
        <div className="divider p-8 pt-16 before:bg-secondary after:bg-secondary before:h-[1px] after:h-[1px]"></div>
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-bold my-8 cursor-default">New</h1>
          <div className="w-full max-w-xl xl:max-w-2xl">
            <button
              className="btn btn-primary btn-lg font-semibold hover:text-base-100 text-2xl rounded-xl w-full"
              onClick={() => router.push('/create')}
            >
              + CREATE NEW MULTISIG
            </button>
          </div>
        </div>
      </div>
    </WalletLoader>
  )
}

export default Home
