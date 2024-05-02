import { useSigningClient } from 'contexts/cosmwasm'
import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from 'components/ThemeToggle'
import NavContractLabel from 'components/NavContractLabel'

function Nav() {
  const { walletAddress, connectWallet, disconnect } = useSigningClient()
  const handleConnect = () => {
    if (walletAddress.length === 0) {
      connectWallet()
    } else {
      disconnect()
    }
  }

  const PUBLIC_SITE_ICON_URL = process.env.NEXT_PUBLIC_SITE_ICON_URL || ''

  return (
    <div className="w-screen px-2 md:px-16">
      <nav className="flex flex-wrap text-center md:text-left md:flex flex-row w-full justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            {PUBLIC_SITE_ICON_URL.length > 0 ? (
              <div className="flex gap-4 p-4 items-center">
                <Image
                  src={'/neptune-foundation-logo.png'}
                  height={50}
                  width={50}
                  alt={'Neptune Foundation Logo'}
                />
                <span className="text-xl">Neptune Foundation</span>
              </div>
            ) : (
              <span className="text-2xl">⚛️ </span>
            )}
          </Link>
        </div>
        <NavContractLabel />
        <ThemeToggle />
        <div className="flex flex-grow md:flex-grow-0 max-w-full pl-4">
          <button
            className={`block btn btn-outline btn-primary w-full max-w-full truncate ${
              walletAddress.length > 0 ? 'lowercase' : ''
            }`}
            onClick={handleConnect}
          >
            {walletAddress || 'Connect Wallet'}
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Nav
