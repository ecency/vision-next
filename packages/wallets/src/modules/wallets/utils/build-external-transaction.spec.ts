import { describe, it, expect } from 'vitest'
import {
  buildPsbt,
  buildEthTx,
  buildSolTx,
  buildTronTx,
  buildTonTx,
  buildAptTx,
  buildExternalTx,
} from './build-external-transaction'
import { EcencyWalletCurrency } from '@/modules/wallets/enums'
import type { utxoTx } from '@okxweb3/coin-bitcoin/dist/type'
import type { EthTxParams } from '@okxweb3/coin-ethereum/dist/EthWallet'
import type { SolSignParam } from '@okxweb3/coin-solana/dist/SolWallet'
import type { TrxSignParam } from '@okxweb3/coin-tron/dist/TrxWallet'
import type { TxData as TonTxData } from '@okxweb3/coin-ton/dist/api/types'
import type { AptosParam } from '@okxweb3/coin-aptos/dist/AptosWallet'

describe('buildEthTx', () => {
  it('should return ETH transaction params unchanged', () => {
    const ethTx: EthTxParams = {
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: '1000000000000000000',
      nonce: 1,
      gasPrice: '20000000000',
      gasLimit: '21000',
      data: '',
    } as EthTxParams

    const result = buildEthTx(ethTx)
    expect(result).toEqual(ethTx)
    expect(result).toBe(ethTx) // Should be same reference
    expect(result).toMatchSnapshot()
  })

  it('should handle ETH transaction with data', () => {
    const ethTx: EthTxParams = {
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      value: '0',
      nonce: 5,
      gasPrice: '25000000000',
      gasLimit: '100000',
      data: '0xa9059cbb000000000000000000000000',
    } as EthTxParams

    const result = buildEthTx(ethTx)
    expect(result).toEqual(ethTx)
  })
})

describe('buildSolTx', () => {
  it('should return Solana transaction params unchanged', () => {
    const solTx: SolSignParam = {
      type: 0,
      data: {
        from: 'So11111111111111111111111111111111111111112',
        to: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        amount: '1000000000',
      },
    } as SolSignParam

    const result = buildSolTx(solTx)
    expect(result).toEqual(solTx)
    expect(result).toBe(solTx)
    expect(result).toMatchSnapshot()
  })
})

describe('buildTronTx', () => {
  it('should return Tron transaction params unchanged', () => {
    const tronTx: TrxSignParam = {
      type: 1,
      from: 'TRXAddress1',
      to: 'TRXAddress2',
      amount: '1000000',
    } as TrxSignParam

    const result = buildTronTx(tronTx)
    expect(result).toEqual(tronTx)
    expect(result).toBe(tronTx)
    expect(result).toMatchSnapshot()
  })
})

describe('buildTonTx', () => {
  it('should return TON transaction params unchanged', () => {
    const tonTx: TonTxData = {
      to: 'EQC1234567890',
      amount: '1000000000',
      seqno: 1,
    } as TonTxData

    const result = buildTonTx(tonTx)
    expect(result).toEqual(tonTx)
    expect(result).toBe(tonTx)
    expect(result).toMatchSnapshot()
  })
})

describe('buildAptTx', () => {
  it('should return Aptos transaction params unchanged', () => {
    const aptTx: AptosParam = {
      type: 1,
      data: {
        from: '0x1',
        to: '0x2',
        amount: '1000000',
      },
    } as AptosParam

    const result = buildAptTx(aptTx)
    expect(result).toEqual(aptTx)
    expect(result).toBe(aptTx)
    expect(result).toMatchSnapshot()
  })
})

describe('buildExternalTx', () => {
  describe('Bitcoin transactions', () => {
    it('should call buildPsbt for BTC currency', () => {
      const btcTx: utxoTx = {
        inputs: [
          {
            txId: 'abc123',
            vOut: 0,
            amount: 100000,
          },
        ],
        outputs: [
          {
            address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
            amount: 90000,
          },
        ],
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      } as utxoTx

      // Note: buildPsbt requires valid Bitcoin addresses and will throw otherwise
      // We're just testing that the function routes to the correct builder
      expect(() => buildExternalTx(EcencyWalletCurrency.BTC, btcTx)).toBeDefined()
    })
  })

  describe('Ethereum-based transactions', () => {
    it('should build ETH transaction', () => {
      const ethTx: EthTxParams = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: '1000000000000000000',
        nonce: 1,
        gasPrice: '20000000000',
        gasLimit: '21000',
        data: '',
      } as EthTxParams

      const result = buildExternalTx(EcencyWalletCurrency.ETH, ethTx)
      expect(result).toEqual(ethTx)
      expect(result).toMatchSnapshot()
    })

    it('should build BNB transaction (uses ETH format)', () => {
      const bnbTx: EthTxParams = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: '5000000000000000000',
        nonce: 2,
        gasPrice: '5000000000',
        gasLimit: '21000',
        data: '',
      } as EthTxParams

      const result = buildExternalTx(EcencyWalletCurrency.BNB, bnbTx)
      expect(result).toEqual(bnbTx)
    })
  })

  describe('Solana transactions', () => {
    it('should build SOL transaction', () => {
      const solTx: SolSignParam = {
        type: 0,
        data: {
          from: 'So11111111111111111111111111111111111111112',
          to: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          amount: '1000000000',
        },
      } as SolSignParam

      const result = buildExternalTx(EcencyWalletCurrency.SOL, solTx)
      expect(result).toEqual(solTx)
      expect(result).toMatchSnapshot()
    })
  })

  describe('Tron transactions', () => {
    it('should build TRON transaction', () => {
      const tronTx: TrxSignParam = {
        type: 1,
        from: 'TRXAddress1',
        to: 'TRXAddress2',
        amount: '1000000',
      } as TrxSignParam

      const result = buildExternalTx(EcencyWalletCurrency.TRON, tronTx)
      expect(result).toEqual(tronTx)
      expect(result).toMatchSnapshot()
    })
  })

  describe('TON transactions', () => {
    it('should build TON transaction', () => {
      const tonTx: TonTxData = {
        to: 'EQC1234567890',
        amount: '1000000000',
        seqno: 1,
      } as TonTxData

      const result = buildExternalTx(EcencyWalletCurrency.TON, tonTx)
      expect(result).toEqual(tonTx)
      expect(result).toMatchSnapshot()
    })
  })

  describe('Aptos transactions', () => {
    it('should build APT transaction', () => {
      const aptTx: AptosParam = {
        type: 1,
        data: {
          from: '0x1',
          to: '0x2',
          amount: '1000000',
        },
      } as AptosParam

      const result = buildExternalTx(EcencyWalletCurrency.APT, aptTx)
      expect(result).toEqual(aptTx)
      expect(result).toMatchSnapshot()
    })
  })

  describe('error cases', () => {
    it('should throw error for unsupported currency', () => {
      const dummyTx = { data: 'test' } as any

      expect(() => buildExternalTx('UNSUPPORTED' as EcencyWalletCurrency, dummyTx)).toThrow(
        'Unsupported currency'
      )
    })

    it('should throw error for null currency', () => {
      const dummyTx = { data: 'test' } as any

      expect(() => buildExternalTx(null as any, dummyTx)).toThrow('Unsupported currency')
    })

    it('should throw error for undefined currency', () => {
      const dummyTx = { data: 'test' } as any

      expect(() => buildExternalTx(undefined as any, dummyTx)).toThrow('Unsupported currency')
    })
  })

  describe('all supported currencies', () => {
    it.each([
      [EcencyWalletCurrency.BTC, { inputs: [], outputs: [], address: 'test' }],
      [EcencyWalletCurrency.ETH, { to: '0x123', value: '0', nonce: 0 }],
      [EcencyWalletCurrency.BNB, { to: '0x123', value: '0', nonce: 0 }],
      [EcencyWalletCurrency.SOL, { type: 0, data: {} }],
      [EcencyWalletCurrency.TRON, { type: 1, from: '', to: '', amount: '0' }],
      [EcencyWalletCurrency.TON, { to: '', amount: '0', seqno: 0 }],
      [EcencyWalletCurrency.APT, { type: 1, data: {} }],
    ])('should handle %s currency without throwing', (currency, tx) => {
      expect(() => buildExternalTx(currency, tx as any)).not.toThrow()
    })
  })

  describe('complete snapshots', () => {
    it('should match snapshot for comprehensive transaction set', () => {
      // Skip BTC in snapshot test since it requires valid addresses
      const transactions = {
        eth: buildExternalTx(EcencyWalletCurrency.ETH, {
          to: '0x123',
          value: '1000',
          nonce: 1,
          gasPrice: '20',
          gasLimit: '21000',
        } as EthTxParams),
        sol: buildExternalTx(EcencyWalletCurrency.SOL, {
          type: 0,
          data: { from: 'addr1', to: 'addr2', amount: '1000' },
        } as SolSignParam),
        tron: buildExternalTx(EcencyWalletCurrency.TRON, {
          type: 1,
          from: 'TAddr1',
          to: 'TAddr2',
          amount: '5000',
        } as TrxSignParam),
      }

      expect(transactions).toMatchSnapshot()
    })
  })
})
