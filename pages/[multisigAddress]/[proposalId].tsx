import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import { VoteInfo, ProposalResponse, CosmosMsgFor_Empty_1 } from 'types/cw3'
import { ExecuteMsg, Vote } from 'types/injective-cw3'
import { executeTx } from 'util/tx'
import { useExecuteTx } from 'hooks/useExecuteTx'
import { set } from 'lodash'
import { prettifyJson } from 'util/conversion'

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
  const executeTxHook = useExecuteTx()
  const router = useRouter()
  const multisigAddress = router.query.multisigAddress as string
  const proposalId = router.query.proposalId as string

  const { walletAddress, signingClient } = useSigningClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [proposal, setProposal] = useState<ProposalResponse | null>(null)
  const [votes, setVotes] = useState([])
  const [transactionHash, setTransactionHash] = useState('')
  const [expireUtcDateString, setExpireUtcDateString] = useState('')

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
  }, [walletAddress, signingClient, multisigAddress, proposalId])

  const handleVote = async (vote: Vote) => {
    setLoading(true)
    setError('')

    const msg: ExecuteMsg = {
      vote: {
        proposal_id: Number(proposalId),
        vote: vote,
      },
    }

    let response
    try {
      response = await executeTx(
        walletAddress,
        multisigAddress,
        msg,
        executeTxHook
      )
    } catch (e) {
      console.log('error', e)
      const errorMessage = e instanceof Error ? e.message : String(e)
      setError(errorMessage)
    }

    console.log('handleVote.response', response)
    setLoading(false)
  }

  const handleExecute = async () => {
    setLoading(true)
    setError('')

    const msg: ExecuteMsg = {
      execute: {
        proposal_id: Number(proposalId),
      },
    }

    let response
    try {
      response = await executeTx(
        walletAddress,
        multisigAddress,
        msg,
        executeTxHook
      )
    } catch (e) {
      console.log('error', e)
      const errorMessage = e instanceof Error ? e.message : String(e)
      setError(errorMessage)
    }

    console.log('handleExecute.response', response)
    /* setTransactionHash(response!.transactionHash) */
    setLoading(false)
  }

  const handleClose = async () => {
    setLoading(true)
    setError('')

    const msg: ExecuteMsg = {
      close: {
        proposal_id: Number(proposalId),
      },
    }

    let response
    try {
      response = await executeTx(
        walletAddress,
        multisigAddress,
        msg,
        executeTxHook
      )
    } catch (e) {
      console.log('error', e)
      const errorMessage = e instanceof Error ? e.message : String(e)
      setError(errorMessage)
    }

    console.log('handleClose.response', response)
    setLoading(false)
  }

  useEffect(() => {
    if (proposal && proposal.expires && 'at_time' in proposal.expires) {
      const timestamp = proposal.expires.at_time
      const expireMs = parseInt(String(timestamp), 10) / 1e6

      if (!isNaN(expireMs)) {
        const expireDate = new Date(expireMs)
        const expireUtcDateString = expireDate
          .toISOString()
          .replace('T', ' ')
          .replace('Z', ' UTC')
        setExpireUtcDateString(expireUtcDateString)
      }
    }
  }, [proposal])

  // Encode the proposal messages to Base64
  const encodeToBase64 = (data: CosmosMsgFor_Empty_1[]) => {
    return btoa(JSON.stringify(data))
  }

  // Decode the Base64 string back to JSON
  const decodeFromBase64 = (base64String: string) => {
    return JSON.parse(atob(base64String))
  }

  const prettyPrint = (data: any) => {
    const formattedJsonString = prettifyJson(data)
    return formattedJsonString
  }

  // Check if proposal and proposal.msgs are defined
  const encodedMsgs = proposal?.msgs ? encodeToBase64(proposal.msgs) : ''
  const decodedMsgs = encodedMsgs ? decodeFromBase64(encodedMsgs) : []

  return (
    <WalletLoader loading={loading}>
      <div className="flex flex-col w-full">
        <div className="grid bg-base-100 place-items-center">
          {!proposal ? (
            <div className="text-center m-8 cursor-default">
              No proposal with that ID found.
            </div>
          ) : (
            <div className="container mx-auto max-w-lg text-left">
              <div className="card-title flex flex-row justify-between m-0 cursor-default">
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
              <div className="flex justify-between text-secondary cursor-default pt-4">
                <div className="flex flex-col text-sm">
                  <span>Proposal ID</span>
                  <span className="text-secondary text-lg">{proposal.id}</span>
                </div>
                <div className="flex flex-col text-sm text-right">
                  <span>Expiration Date</span>
                  <span className="text-secondary text-lg">
                    {expireUtcDateString}
                  </span>
                </div>
              </div>
              <p className="my-8 cursor-default">{proposal.description}</p>
              <span className="flex pb-1">JSON Message</span>
              <div className="p-2 border border-black rounded mb-4">
                <code className="break-all">
                  {JSON.stringify(proposal.msgs)}
                </code>
              </div>
              <span className="flex pb-1">Base64</span>
              <div className="p-2 border border-black rounded mb-4">
                <code className="break-all">{encodedMsgs}</code>
              </div>
              <span className="flex pb-1">Pretty</span>
              <div className="p-2 border border-black rounded mb-8">
                <pre className="break-all" style={{ whiteSpace: 'pre-wrap' }}>
                  {prettyPrint(proposal?.msgs)}
                </pre>
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
