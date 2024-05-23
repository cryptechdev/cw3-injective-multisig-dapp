import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import { ExecuteMsg } from 'types/injective-cw3'
import { useExecuteTx } from 'hooks/useExecuteTx'
import { executeTx } from 'util/tx'
import cloneDeep from 'lodash.clonedeep'

interface FormElements extends HTMLFormControlsCollection {
  label: HTMLInputElement
  description: HTMLInputElement
  json: HTMLInputElement
}

interface ProposalFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

const ProposalCreate: NextPage = () => {
  const executeTxHook = useExecuteTx()
  const router = useRouter()
  const multisigAddress = (router.query.multisigAddress || '') as string
  const { walletAddress } = useSigningClient()
  const [transactionHash, setTransactionHash] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [proposalID, setProposalID] = useState('')

  const handleSubmit = async (event: FormEvent<ProposalFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const currentTarget = event.currentTarget as ProposalFormElement

    const title = currentTarget.label.value.trim()
    const description = currentTarget.description.value.trim()
    const jsonStr = currentTarget.json.value.trim()

    if (
      title.length === 0 ||
      description.length === 0 ||
      jsonStr.length === 0
    ) {
      setLoading(false)
      setError('All fields are required.')
    }

    // Clone the JSON string to avoid prototype poisoning
    const jsonClone = cloneDeep(jsonStr)
    let json: any
    try {
      json = JSON.parse(jsonClone)
    } catch (e) {
      setLoading(false)
      setError('Error in JSON message.')
      return
    }

    const proposeMsg: ExecuteMsg = {
      propose: {
        description: String(description),
        msgs: JSON.parse(jsonStr),
        title: String(title),
      },
    }

    let response
    try {
      response = await executeTx(
        walletAddress,
        multisigAddress,
        proposeMsg,
        executeTxHook
      )
    } catch (e) {
      console.log('error', e)
    }

    console.log('ProposalCreate.response', response)

    const getProposalId = (response: any): string | null => {
      const logs = response.logs
      for (const log of logs) {
        for (const event of log.events) {
          if (event.type === 'wasm') {
            for (const attribute of event.attributes) {
              if (attribute.key === 'proposal_id') {
                return attribute.value
              }
            }
          }
        }
      }
      return null
    }

    console.log('ProposalCreate.response', response)

    setProposalID(getProposalId(response) || '')
    setTransactionHash(response?.transactionHash || '')

    setLoading(false)
  }

  const complete = transactionHash.length > 0

  return (
    <WalletLoader>
      <div className="flex flex-col w-full">
        <div className="grid bg-base-100 place-items-center cursor-default">
          <form
            className="text-left container mx-auto max-w-lg"
            onSubmit={handleSubmit}
          >
            <h1 className="text-4xl my-8 text-bold">Create Proposal</h1>
            <label className="block">Title</label>
            <input
              className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
              name="label"
              readOnly={complete}
            />
            <label className="block mt-4">Description</label>
            <textarea
              className="input input-bordered rounded box-border p-3 h-24 w-full focus:input-primary text-xl"
              name="description"
              readOnly={complete}
            />
            <label className="block mt-4">JSON Message Array</label>
            <textarea
              className="input input-bordered rounded box-border p-3 w-full font-mono h-80 focus:input-primary text-x"
              cols={7}
              name="json"
              readOnly={complete}
              placeholder='[{"bank":{"send":{"amount":[{"amount":"1000000000000000","denom":"inj"}],"to_address":"inj1u6szhpax4jfpastv7rw4ddu7yn95s96f5pes0p"}}}]'
            />
            {!complete && (
              <button
                className={`btn btn-primary text-lg mt-8 ml-auto ${
                  loading ? 'loading' : ''
                }`}
                style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
                type="submit"
                disabled={loading}
              >
                Create Proposal
              </button>
            )}
            {error && (
              <div className="mt-8">
                <LineAlert variant="error" msg={error} />
              </div>
            )}

            {proposalID.length > 0 && (
              <div className="mt-8 text-right">
                <LineAlert
                  variant="success"
                  msg={`Success! Transaction Hash: ${transactionHash}`}
                />
                <button
                  className="mt-4 box-border px-4 py-2 btn btn-primary"
                  onClick={(e) => {
                    e.preventDefault()
                    router.push(`/${multisigAddress}/${proposalID}`)
                  }}
                >
                  View Proposal &#8599;
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </WalletLoader>
  )
}

export default ProposalCreate
