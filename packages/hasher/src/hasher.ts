import { BigNumber } from '@ethersproject/bignumber';
import type { BytesLike } from '@ethersproject/bytes';
import { sha256 } from '@ethersproject/sha2';
import { ZeroBytes32 } from '@fuel-ts/constants';
import type { TransactionRequestLike, UtxoId } from '@fuel-ts/providers';
import {
  transactionRequestify,
  OutputType,
  InputType,
  TransactionCoder,
  TransactionType,
} from '@fuel-ts/providers';
import cloneDeep from 'lodash.clonedeep';

/**
 * hash string messages with sha256
 *
 * @param msg - The string message to be hashed
 * @returns A sha256 hash of the message
 */
export function hashMessage(msg: string) {
  return sha256(Buffer.from(msg));
}

/**
 * Hash transaction request with sha256. [Read more](https://github.com/FuelLabs/fuel-specs/blob/master/specs/protocol/identifiers.md#transaction-id)
 *
 * @param transactionRequest - Transaction request to be hashed
 * @returns sha256 hash of the transaction
 */
export function hashTransaction(transactionRequestLike: TransactionRequestLike) {
  const transactionRequest = transactionRequestify(transactionRequestLike);
  // Return a new transaction object without references to the original transaction request
  const transaction = transactionRequest.toTransaction();

  if (transaction.type === TransactionType.Script) {
    transaction.receiptsRoot = ZeroBytes32;
  }

  // Zero out input fields
  transaction.inputs = transaction.inputs.map((input) => {
    const inputClone = cloneDeep(input);

    switch (inputClone.type) {
      // Zero out on signing: txoPointer
      case InputType.Coin: {
        // inputClone.txoPointer = 0;
        return inputClone;
      }
      // Zero out on signing: txID, outputIndex, balanceRoot, stateRoot, and txoPointer
      case InputType.Contract: {
        // inputClone.txoPointer;
        inputClone.utxoID = <UtxoId>{
          outputIndex: BigNumber.from(0),
          transactionId: ZeroBytes32,
        };
        inputClone.balanceRoot = ZeroBytes32;
        inputClone.stateRoot = ZeroBytes32;
        return inputClone;
      }
      default:
        return inputClone;
    }
  });
  // Zero out output fields
  transaction.outputs = transaction.outputs.map((output) => {
    const outputClone = cloneDeep(output);

    switch (outputClone.type) {
      // Zero out on signing: balanceRoot, stateRoot
      case OutputType.Contract: {
        outputClone.balanceRoot = ZeroBytes32;
        outputClone.stateRoot = ZeroBytes32;
        return outputClone;
      }
      // Zero out on signing: amount
      case OutputType.Change: {
        outputClone.to = ZeroBytes32;
        outputClone.amount = BigNumber.from(0);
        outputClone.assetId = ZeroBytes32;
        return outputClone;
      }
      // Zero out on signing: amount
      case OutputType.Variable: {
        outputClone.amount = BigNumber.from(0);
        return outputClone;
      }
      default:
        return outputClone;
    }
  });
  transaction.witnessesCount = BigNumber.from(0);
  transaction.witnesses = [];

  return sha256(new TransactionCoder('transaction').encode(transaction));
}

/**
 * wrap sha256
 *
 * @param data - The data to be hash
 * @returns A sha256 hash of the data
 */
export function hash(data: BytesLike) {
  return sha256(data);
}
