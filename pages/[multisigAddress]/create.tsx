import type { NextPage } from 'next'
import WalletLoader from 'components/WalletLoader'
import { useSigningClient } from 'contexts/cosmwasm'
import { useState, FormEvent, useEffect } from 'react'
import { useRouter } from 'next/router'
import LineAlert from 'components/LineAlert'
import { ExecuteMsg } from 'types/injective-cw3'
import { useExecuteTx } from 'hooks/useExecuteTx'
import { executeTx } from 'util/tx'
import cloneDeep from 'lodash.clonedeep'
import { prettifyJson } from 'util/conversion'

interface FormElements extends HTMLFormControlsCollection {
  label: HTMLInputElement
  description: HTMLInputElement
  json: HTMLInputElement
}

interface ProposalFormElement extends HTMLFormElement {
  readonly elements: FormElements
}

const encodeToBase64 = (data: any) => {
  const jsonString = data
  return window.btoa(unescape(encodeURIComponent(jsonString)))
}

const decodeFromBase64 = (base64String: string) => {
  try {
    return JSON.parse(decodeURIComponent(escape(window.atob(base64String))))
  } catch (error) {
    console.error('Error decoding base64:', error)
    return 'Error decoding base64'
  }
}

const prettyPrint = (data: any) => {
  const formattedJsonString = prettifyJson(data)
  return formattedJsonString
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
  const [dataType, setDataType] = useState<
    'json' | 'base64' | 'jsonArray' | 'unknown'
  >('unknown')

  const [formData, setFormData] = useState({
    label: '',
    description: '',
    json: '',
  })

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData({
      ...formData,
      [name]: value.trim(),
    })
  }

  const detectJsonOrBase64 = (
    str: string
  ): 'json' | 'base64' | 'jsonArray' | 'unknown' => {
    try {
      // Try to parse the string as JSON
      const parsedJson = JSON.parse(str)
      if (Array.isArray(parsedJson)) {
        return 'jsonArray'
      }
      return 'json'
    } catch (error) {
      // If parsing as JSON fails, check if it's base64-encoded
      if (/^[A-Za-z0-9+/=]+$/.test(str) && str.length % 4 === 0) {
        try {
          // Try to decode the string from base64
          atob(str)
          return 'base64'
        } catch (error) {
          // Decoding failed, so it's not valid base64
          return 'unknown'
        }
      } else {
        // Not valid base64 format
        return 'unknown'
      }
    }
  }

  const { json } = formData
  const [decodedMsgs, setDecodedMsgs] = useState('')
  const [encodedMsgs, setEncodedMsgs] = useState('')
  const [jsonRaw, setJsonRaw] = useState<any[]>([])

  useEffect(() => {
    const dataType = detectJsonOrBase64(json)
    setDataType(dataType)

    const jsonRaw = dataType === 'jsonArray' ? JSON.parse(json) : []
    const encoded = dataType === 'json' ? encodeToBase64(json) : ''
    const decoded = decodeFromBase64(json)

    setJsonRaw(jsonRaw)
    setDecodedMsgs(decoded)
    setEncodedMsgs(encoded)
  }, [json])

  // Decode the messages in the proposal
  const decodedMessages =
    dataType === 'jsonArray' && jsonRaw !== null
      ? jsonRaw.map((item: any) => {
          try {
            if (item.wasm) {
              if (item.wasm.execute && item.wasm.execute.msg) {
                return {
                  ...item,
                  wasm: {
                    ...item.wasm,
                    execute: {
                      ...item.wasm.execute,
                      msg: decodeFromBase64(item.wasm.execute.msg),
                    },
                  },
                }
              } else if (item.wasm.instantiate && item.wasm.instantiate.msg) {
                return {
                  ...item,
                  wasm: {
                    ...item.wasm,
                    instantiate: {
                      ...item.wasm.instantiate,
                      msg: decodeFromBase64(item.wasm.instantiate.msg),
                    },
                  },
                }
              }
            }
            return item
          } catch (error) {
            console.error('Error decoding message:', error)
            return {
              ...item,
              error: 'Failed to decode message',
            }
          }
        })
      : []

  const handleSubmit = async (event: FormEvent<ProposalFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    const currentTarget = event.currentTarget as ProposalFormElement

    const title = currentTarget.label.value.trim()
    const description = currentTarget.description.value.trim()
    let jsonStr = currentTarget.json.value.trim()

    if (
      title.length === 0 ||
      description.length === 0 ||
      jsonStr.length === 0
    ) {
      setLoading(false)
      setError('All fields are required.')
      return
    }

    // If the data is base64-encoded, decode it
    if (dataType === 'base64') {
      try {
        jsonStr = decodeFromBase64(jsonStr)
      } catch (error) {
        setLoading(false)
        setError('Error decoding base64 data.')
        return
      }
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
      if (!response || !response.logs) {
        return null
      }

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
      <div className="flex flex-col w-full pb-12">
        <div className="grid bg-base-100 place-items-center cursor-default">
          <form className="text-left container mx-auto" onSubmit={handleSubmit}>
            <h1 className="text-4xl my-8 text-bold">Create Proposal</h1>
            <label className="block mb-2">Title</label>
            <input
              className="input input-bordered rounded box-border p-3 w-full focus:input-primary text-xl"
              name="label"
              readOnly={complete}
            />
            <label className="block mt-4 mb-2">Description</label>
            <textarea
              className="input input-bordered rounded box-border p-3 h-24 w-full focus:input-primary text-xl"
              name="description"
              readOnly={complete}
            />
            <label className="block mt-4 mb-2">Message</label>
            <textarea
              className="input input-bordered rounded box-border p-3 w-full font-mono h-[440px] focus:input-primary text-x"
              name="json"
              readOnly={complete}
              onChange={handleChange}
              placeholder='[{"bank":{"send":{"amount":[{"amount":"1000000000000000","denom":"inj"}],"to_address":"inj1u6szhpax4jfpastv7rw4ddu7yn95s96f5pes0p"}}}]'
            />
            <div className="flex mt-4 mb-2 gap-2">
              <label className="">Data Type:</label>
              <span className="font-bold">{dataType}</span>
            </div>
            {dataType === 'json' && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="pt-4">Encoded as Base64</span>
                <div className="p-2 border border-black rounded">
                  <code className="break-all">{encodedMsgs}</code>
                </div>
              </div>
            )}
            {dataType === 'jsonArray' && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="pt-4">Decoded</span>
                <div className="p-2 border border-black rounded mb-8">
                  <pre className="break-all" style={{ whiteSpace: 'pre-wrap' }}>
                    {prettyPrint(decodedMessages)}
                  </pre>
                </div>
              </div>
            )}
            {dataType === 'base64' && (
              <div className="flex flex-col gap-2 pt-2">
                <span className="pt-4">Decoded</span>
                <div className="p-2 border border-black rounded">
                  <pre className="break-all" style={{ whiteSpace: 'pre-wrap' }}>
                    {prettyPrint(decodedMsgs)}
                  </pre>
                </div>
              </div>
            )}
            <div className="flex">
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
            </div>
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
