import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import ProposalCard from 'components/ProposalCard'
import { ProposalListResponse, ProposalResponse, Timestamp } from 'types/cw3'

// TODO: review union Expiration from types/cw3
type Expiration = {
  at_time: Timestamp
}

const Home: NextPage = () => {
  const router = useRouter()
  const multisigAddress = router.query.multisigAddress as string

  const { walletAddress, signingClient } = useSigningClient()
  const [reversedProposals, setReversedProposals] = useState<
    ProposalResponse[]
  >([])
  const [hideLoadMore, setHideLoadMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [startBefore, setStartBefore] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('')

  useEffect(() => {
    if (!multisigAddress || !signingClient) {
      setLabel('')
      return
    }

    signingClient.getContract(multisigAddress).then((response) => {
      setLabel(response.label)
      setAddress(response.address)
    })

    const storedAddresses =
      JSON.parse(localStorage.getItem('stored-multisig-addresses')!) || []

    const existingAddress = storedAddresses.find(
      (item: { address: string }) => item.address === multisigAddress
    )

    if (!existingAddress) {
      signingClient.getContract(multisigAddress).then((response) => {
        const newEntry = { address: response.address, label: response.label }
        storedAddresses.push(newEntry)
        localStorage.setItem(
          'stored-multisig-addresses',
          JSON.stringify(storedAddresses)
        )

        setLabel(response.label)
        setAddress(response.address)
      })
    } else {
      setLabel(existingAddress.label)
      setAddress(existingAddress.address)
    }
  }, [multisigAddress, signingClient])

  useEffect(() => {
    if (address.length === 0 || !signingClient) {
      return
    }

    signingClient?.getBalance(address, 'inj').then((response) => {
      setBalance(response.amount)
    })
  }, [address, signingClient])

  const fetchProposals = useCallback(() => {
    if (walletAddress.length === 0 || !signingClient) {
      setReversedProposals([])
      setHideLoadMore(false)
      return
    }

    setLoading(true)

    signingClient
      .queryContractSmart(multisigAddress, {
        reverse_proposals: {
          ...(startBefore && { start_before: startBefore }),
          limit: 10,
        },
      })
      .then((response: ProposalListResponse) => {
        if (response.proposals.length < 10) {
          setHideLoadMore(true)
        }

        // Filter out duplicates
        setReversedProposals((prevProposals) => {
          const newProposals = response.proposals.filter(
            (proposal) =>
              !prevProposals.some(
                (prevProposal) => prevProposal.id === proposal.id
              )
          )
          return prevProposals.concat(newProposals)
        })
      })
      .catch((err) => {
        console.log('Error:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [walletAddress, signingClient, multisigAddress, startBefore])

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  return (
    <WalletLoader loading={reversedProposals.length === 0 && loading}>
      <div className="w-full cursor-default">
        <div className="flex flex-col w-full max-w-[1200px] m-auto px-16">
          <div className="flex flex-col items-center my-16 px-8 gap-4">
            <h1 className="text-xl font-bold sm:text-5xl">{label}</h1>
            <h1 className="text-md sm:text-2xl">{address}</h1>
            <h1 className="text-lg font-bold sm:text-3xl">
              {Number(balance) / 10e17} INJ
            </h1>
          </div>
        </div>
        <div className="flex flex-col w-full max-w-[1200px] m-auto px-16">
          <div className="flex flex-row justify-between items-center my-8 px-8">
            <h1 className="text-lg font-bold sm:text-3xl">Proposals</h1>
            <button
              className="btn btn-primary btn-md text-lg"
              onClick={() =>
                router.push(`/${encodeURIComponent(multisigAddress)}/create`)
              }
            >
              + Create Proposal
            </button>
          </div>
        </div>
        <div className="w-full max-w-[1200px] m-auto px-16">
          {reversedProposals.length === 0 && (
            <div className="text-center">
              No proposals found, please create a proposal.
            </div>
          )}
          {reversedProposals.map((proposal) => {
            const { title, id, status } = proposal
            const expires = proposal.expires as Expiration

            return (
              <ProposalCard
                key={id}
                title={title}
                id={`${id}`}
                status={status}
                expires_at={parseInt(expires.at_time)}
                multisigAddress={multisigAddress}
              />
            )
          })}
          {!hideLoadMore && (
            <button
              className="btn btn-primary btn-outline text-lg w-full mt-2"
              onClick={() => {
                const proposal = reversedProposals[reversedProposals.length - 1]
                setStartBefore(proposal.id)
              }}
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </WalletLoader>
  )
}

export default Home
