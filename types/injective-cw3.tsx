/**
 * Duration is a delta of time. You can add it to a BlockInfo or Expiration to move that further in the future. Note that an height-based Duration and a time-based Expiration cannot be combined
 */
export type Duration = {
  time: number
}
/**
 * This defines the different ways tallies can happen.
 *
 * The total_weight used for calculating success as well as the weights of each individual voter used in tallying should be snapshotted at the beginning of the block at which the proposal starts (this is likely the responsibility of a correct cw4 implementation). See also `ThresholdResponse` in the cw3 spec.
 */
export type Threshold = {
  absolute_count: {
    weight: number
    [k: string]: unknown
  }
}
/**
 * A fixed-point decimal value with 18 fractional digits, i.e. Decimal(1_000_000_000_000_000_000) == 1.0
 *
 * The greatest possible value that can be represented is 340282366920938463463.374607431768211455 (which is (2^128 - 1) / 10^18)
 */
export type Decimal = string

export interface InstantiateMsg {
  max_voting_period: Duration
  threshold: Threshold
  voters: Voter[]
  [k: string]: unknown
}
export interface Voter {
  addr: string
  weight: number
  [k: string]: unknown
}

export type QueryMsg =
  | {
      threshold: {
        [k: string]: unknown
      }
    }
  | {
      proposal: {
        proposal_id: number
        [k: string]: unknown
      }
    }
  | {
      list_proposals: {
        limit?: number | null
        start_after?: number | null
        [k: string]: unknown
      }
    }
  | {
      reverse_proposals: {
        limit?: number | null
        start_before?: number | null
        [k: string]: unknown
      }
    }
  | {
      vote: {
        proposal_id: number
        voter: string
        [k: string]: unknown
      }
    }
  | {
      list_votes: {
        limit?: number | null
        proposal_id: number
        start_after?: string | null
        [k: string]: unknown
      }
    }
  | {
      voter: {
        address: string
        [k: string]: unknown
      }
    }
  | {
      list_voters: {
        limit?: number | null
        start_after?: string | null
        [k: string]: unknown
      }
    }

export type ExecuteMsg =
  | {
      propose: {
        description: string
        latest?: Expiration | null
        msgs: CosmosMsgFor_Empty[]
        title: string
        [k: string]: unknown
      }
    }
  | {
      vote: {
        proposal_id: number
        vote: Vote
        [k: string]: unknown
      }
    }
  | {
      execute: {
        proposal_id: number
        [k: string]: unknown
      }
    }
  | {
      close: {
        proposal_id: number
        [k: string]: unknown
      }
    }
/**
 * Expiration represents a point in time when some event happens. It can compare with a BlockInfo and will return is_expired() == true once the condition is hit (and for every block in the future)
 */
export type Expiration =
  | {
      at_height: number
    }
  | {
      at_time: Timestamp
    }
  | {
      never: {
        [k: string]: unknown
      }
    }
/**
 * A point in time in nanosecond precision.
 *
 * This type can represent times from 1970-01-01T00:00:00Z to 2554-07-21T23:34:33Z.
 *
 * ## Examples
 *
 * ``` # use cosmwasm_std::Timestamp; let ts = Timestamp::from_nanos(1_000_000_202); assert_eq!(ts.nanos(), 1_000_000_202); assert_eq!(ts.seconds(), 1); assert_eq!(ts.subsec_nanos(), 202);
 *
 * let ts = ts.plus_seconds(2); assert_eq!(ts.nanos(), 3_000_000_202); assert_eq!(ts.seconds(), 3); assert_eq!(ts.subsec_nanos(), 202); ```
 */
export type Timestamp = Uint64
/**
 * A thin wrapper around u64 that is using strings for JSON encoding/decoding, such that the full u64 range can be used for clients that convert JSON numbers to floats, like JavaScript and jq.
 *
 * # Examples
 *
 * Use `from` to create instances of this and `u64` to get the value out:
 *
 * ``` # use cosmwasm_std::Uint64; let a = Uint64::from(42u64); assert_eq!(a.u64(), 42);
 *
 * let b = Uint64::from(70u32); assert_eq!(b.u64(), 70); ```
 */
export type Uint64 = string
export type CosmosMsgFor_Empty =
  | {
      bank: BankMsg
    }
  | {
      custom: Empty
    }
  | {
      staking: StakingMsg
    }
  | {
      distribution: DistributionMsg
    }
  | {
      wasm: WasmMsg
    }
/**
 * The message types of the bank module.
 *
 * See https://github.com/cosmos/cosmos-sdk/blob/v0.40.0/proto/cosmos/bank/v1beta1/tx.proto
 */
export type BankMsg =
  | {
      send: {
        amount: Coin[]
        to_address: string
        [k: string]: unknown
      }
    }
  | {
      burn: {
        amount: Coin[]
        [k: string]: unknown
      }
    }
/**
 * A thin wrapper around u128 that is using strings for JSON encoding/decoding, such that the full u128 range can be used for clients that convert JSON numbers to floats, like JavaScript and jq.
 *
 * # Examples
 *
 * Use `from` to create instances of this and `u128` to get the value out:
 *
 * ``` # use cosmwasm_std::Uint128; let a = Uint128::from(123u128); assert_eq!(a.u128(), 123);
 *
 * let b = Uint128::from(42u64); assert_eq!(b.u128(), 42);
 *
 * let c = Uint128::from(70u32); assert_eq!(c.u128(), 70); ```
 */
export type Uint128 = string
/**
 * The message types of the staking module.
 *
 * See https://github.com/cosmos/cosmos-sdk/blob/v0.40.0/proto/cosmos/staking/v1beta1/tx.proto
 */
export type StakingMsg =
  | {
      delegate: {
        amount: Coin
        validator: string
        [k: string]: unknown
      }
    }
  | {
      undelegate: {
        amount: Coin
        validator: string
        [k: string]: unknown
      }
    }
  | {
      redelegate: {
        amount: Coin
        dst_validator: string
        src_validator: string
        [k: string]: unknown
      }
    }
/**
 * The message types of the distribution module.
 *
 * See https://github.com/cosmos/cosmos-sdk/blob/v0.42.4/proto/cosmos/distribution/v1beta1/tx.proto
 */
export type DistributionMsg =
  | {
      set_withdraw_address: {
        /**
         * The `withdraw_address`
         */
        address: string
        [k: string]: unknown
      }
    }
  | {
      withdraw_delegator_reward: {
        /**
         * The `validator_address`
         */
        validator: string
        [k: string]: unknown
      }
    }
/**
 * The message types of the wasm module.
 *
 * See https://github.com/CosmWasm/wasmd/blob/v0.14.0/x/wasm/internal/types/tx.proto
 */
export type WasmMsg =
  | {
      execute: {
        contract_addr: string
        funds: Coin[]
        /**
         * msg is the json-encoded ExecuteMsg struct (as raw Binary)
         */
        msg: Binary
        [k: string]: unknown
      }
    }
  | {
      instantiate: {
        admin?: string | null
        code_id: number
        funds: Coin[]
        /**
         * A human-readbale label for the contract
         */
        label: string
        /**
         * msg is the JSON-encoded InstantiateMsg struct (as raw Binary)
         */
        msg: Binary
        [k: string]: unknown
      }
    }
  | {
      migrate: {
        contract_addr: string
        /**
         * msg is the json-encoded MigrateMsg struct that will be passed to the new code
         */
        msg: Binary
        /**
         * the code_id of the new logic to place in the given contract
         */
        new_code_id: number
        [k: string]: unknown
      }
    }
  | {
      update_admin: {
        admin: string
        contract_addr: string
        [k: string]: unknown
      }
    }
  | {
      clear_admin: {
        contract_addr: string
        [k: string]: unknown
      }
    }
/**
 * Binary is a wrapper around Vec<u8> to add base64 de/serialization with serde. It also adds some helper methods to help encode inline.
 *
 * This is only needed as serde-json-{core,wasm} has a horrible encoding for Vec<u8>
 */
export type Binary = string
export type Vote = 'yes' | 'no' | 'abstain' | 'veto'

export interface Coin {
  amount: Uint128
  denom: string
  [k: string]: unknown
}
/**
 * An empty struct that serves as a placeholder in different places, such as contracts that don't set a custom message.
 *
 * It is designed to be expressable in correct JSON and JSON Schema but contains no meaningful data. Previously we used enums without cases, but those cannot represented as valid JSON Schema (https://github.com/CosmWasm/cosmwasm/issues/451)
 */
export interface Empty {
  [k: string]: unknown
}
