import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import { VoteInfo, ProposalResponse } from 'types/cw3'

const icons = {
  bell: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      className="flex-shrink-0 w-6 h-6 ml-2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      ></path>
    </svg>
  ),
  info: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="w-6 h-6 ml-2 stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      ></path>
    </svg>
  ),
  warning: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="w-6 h-6 ml-2 stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      ></path>
    </svg>
  ),
  error: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      className="w-6 h-6 ml-2 stroke-current"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
      ></path>
    </svg>
  ),
  success: (
    <input
      type="checkbox"
      checked={true}
      readOnly={true}
      className="checkbox checkbox-accent"
    />
  ),
}

function VoteButtons({
  onVoteYes = () => {},
  onVoteNo = () => {},
  onBack = (e: any) => {},
  votes = [],
  walletAddress = '',
  status = '',
}) {
  const [vote]: VoteInfo[] = votes.filter(
    (v: VoteInfo) => v.voter === walletAddress
  )

  if (vote) {
    const variant =
      vote.vote === 'yes' ? 'success' : vote.vote === 'no' ? 'error' : 'error'
    const msg = `You voted ${vote.vote}`
    return (
      <>
        <LineAlert className="mt-2" variant={variant} msg={msg} />
        {status === 'open' && (
          <button
            className="box-border px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white my-4"
            onClick={onBack}
          >
            {'< Proposals'}
          </button>
        )}
      </>
    )
  }
  if (status !== 'open') {
    return null
  }
  return (
    <div className="flex justify-between content-center mt-2">
      <button
        className="box-border px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
        onClick={onBack}
      >
        {'< Proposals'}
      </button>

      <button
        className="box-border px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
        onClick={onVoteYes}
      >
        Sign
      </button>
      <button
        className="box-border px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
        onClick={onVoteNo}
      >
        Reject
      </button>
    </div>
  )
}

const Proposal: NextPage = () => {
  const router = useRouter()
  const multisigAddress = router.query.multisigAddress as string
  const proposalId = router.query.proposalId as string

  const { walletAddress, signingClient } = useSigningClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<ProposalResponse | null>(null)
  const [votes, setVotes] = useState([])
  const [timestamp, setTimestamp] = useState(new Date())
  const [transactionHash, setTransactionHash] = useState('')

  useEffect(() => {
    if (walletAddress.length === 0 || !signingClient) {
      return
    }
    setLoading(true)
    Promise.all([
      signingClient.queryContractSmart(multisigAddress, {
        proposal: { proposal_id: parseInt(proposalId) },
      }),
      signingClient.queryContractSmart(multisigAddress, {
        list_votes: { proposal_id: parseInt(proposalId) },
      }),
    ])
      .then((values) => {
        const [proposal, { votes }] = values
        setProposal(proposal)
        setVotes(votes)
        setLoading(false)
      })
      .catch((err) => {
        setLoading(false)
        setError(err.message)
      })
  }, [walletAddress, signingClient, multisigAddress, proposalId, timestamp])

  const handleVote = async (vote: string) => {
    signingClient
      ?.execute(
        walletAddress,
        multisigAddress,
        {
          vote: { proposal_id: parseInt(proposalId), vote },
        },
        defaultFee
      )
      .then((response) => {
        setTimestamp(new Date())
        setTransactionHash(response.transactionHash)
      })
      .catch((err) => {
        setLoading(false)
        setError(err.message)
      })
  }

  const handleExecute = async () => {
    setError('')
    signingClient
      ?.execute(
        walletAddress,
        multisigAddress,
        {
          execute: { proposal_id: parseInt(proposalId) },
        },
        defaultFee
      )
      .then((response) => {
        setTimestamp(new Date())
        setTransactionHash(response.transactionHash)
      })
      .catch((err) => {
        setLoading(false)
        setError(err.message)
      })
  }

  const handleClose = async () => {
    setError('')
    signingClient
      ?.execute(
        walletAddress,
        multisigAddress,
        {
          close: { proposal_id: parseInt(proposalId) },
        },
        defaultFee
      )
      .then((response) => {
        setTimestamp(new Date())
        setTransactionHash(response.transactionHash)
      })
      .catch((err) => {
        setLoading(false)
        setError(err.message)
      })
  }

  return (
    <WalletLoader loading={loading}>
      <div className="flex flex-col w-full">
        <div className="grid bg-base-100 place-items-center">
          {!proposal ? (
            <div className="text-center m-8">
              No proposal with that ID found.
            </div>
          ) : (
            <div className="container mx-auto max-w-lg text-left">
              <div className="card-title flex flex-row justify-between m-0">
                <div>{proposal.title}</div>
                {proposal.status === 'passed' && (
                  <div className="text-2xl text-warning">{icons.warning}</div>
                )}
                {proposal.status === 'rejected' && (
                  <div className="text-2xl text-error">{icons.error}</div>
                )}
                {proposal.status === 'executed' && (
                  <div className="text-2xl text-success">&#x2713;</div>
                )}
                {proposal.status === 'open' && (
                  <div className="text-2xl text-info">{icons.bell}</div>
                )}
              </div>
              <div className="flex justify-between text-sm text-secondary">
                <span>{proposal.id}</span>
                <span>{JSON.stringify(proposal.expires)}</span>
              </div>
              <p className="my-8">{proposal.description}</p>
              <div className="p-2 border border-black rounded mb-8">
                <code className="break-all">
                  {JSON.stringify(proposal.msgs)}
                </code>
              </div>

              <VoteButtons
                onVoteYes={handleVote.bind(null, 'yes')}
                onVoteNo={handleVote.bind(null, 'no')}
                onBack={(e) => {
                  e.preventDefault()
                  router.push(`/${multisigAddress}`)
                }}
                votes={votes}
                walletAddress={walletAddress}
                status={proposal.status}
              />

              {error && (
                <LineAlert className="mt-2" variant="error" msg={error} />
              )}

              {transactionHash.length > 0 && (
                <div className="mt-8">
                  <LineAlert
                    variant="success"
                    msg={`Success! Transaction Hash: ${transactionHash}`}
                  />
                </div>
              )}

              {proposal.status !== 'open' && (
                <div className="flex justify-between content-center my-8">
                  <button
                    className="box-border px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 text-white"
                    onClick={(e) => {
                      e.preventDefault()
                      router.push(`/${multisigAddress}`)
                    }}
                  >
                    {'< Proposals'}
                  </button>
                  {proposal.status === 'passed' && (
                    <button
                      className="box-border px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white"
                      onClick={handleExecute}
                    >
                      Execute
                    </button>
                  )}
                  {proposal.status === 'rejected' && (
                    <button
                      className="box-border px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
                      onClick={handleClose}
                    >
                      Close
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </WalletLoader>
  )
}

export default Proposal
