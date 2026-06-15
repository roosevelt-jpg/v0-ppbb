'use client'

import React, { useEffect, useState } from 'react'
import { DigitalWallet } from '@/lib/types'
import { getDigitalWallet, addWalletTransaction } from '@/lib/advanced-feature-queries'
import { useAuth } from '@/lib/auth-context'

export default function DigitalWalletPage() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<DigitalWallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [transactionLoading, setTransactionLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return

    const fetchWallet = async () => {
      try {
        const walletData = await getDigitalWallet(user.id)
        setWallet(walletData)
      } catch (error) {
        console.error('[v0] Error fetching wallet:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWallet()
  }, [user?.id])

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id || !wallet || !withdrawAmount) return

    const amount = parseFloat(withdrawAmount)
    if (amount > wallet.balance) {
      alert('Insufficient balance')
      return
    }

    setTransactionLoading(true)
    try {
      await addWalletTransaction(user.id, 'spend', amount, 'Withdrawal', 'manual_withdrawal')
      setWithdrawAmount('')
      // Refresh wallet
      const updated = await getDigitalWallet(user.id)
      setWallet(updated)
      alert('Withdrawal initiated successfully!')
    } catch (error) {
      console.error('[v0] Error processing withdrawal:', error)
      alert('Failed to process withdrawal')
    } finally {
      setTransactionLoading(false)
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading wallet...</div>
  if (!wallet) return <div style={{ padding: '40px', textAlign: 'center' }}>No wallet data</div>

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#111111', marginBottom: '32px' }}>Digital Wallet</h1>

      {/* Balance Card */}
      <div
        style={{
          padding: '32px',
          backgroundColor: '#111111',
          color: '#fff',
          borderRadius: '12px',
          marginBottom: '32px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>Current Balance</div>
        <div style={{ fontSize: '48px', fontWeight: 700 }}>
          AED {wallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '8px' }}>{wallet.currency}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        {/* Withdrawal Section */}
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111111', marginBottom: '16px' }}>Withdraw Funds</h3>
          <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              max={wallet.balance}
              style={{
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            <button
              type="submit"
              disabled={transactionLoading || !withdrawAmount}
              style={{
                padding: '10px 16px',
                backgroundColor: '#111111',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                opacity: transactionLoading || !withdrawAmount ? 0.5 : 1,
              }}
            >
              {transactionLoading ? 'Processing...' : 'Withdraw'}
            </button>
          </form>
        </div>

        {/* Earn More Section */}
        <div style={{ padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111111', marginBottom: '16px' }}>Ways to Earn</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li style={{ fontSize: '13px', color: '#666' }}>Refer new members</li>
            <li style={{ fontSize: '13px', color: '#666' }}>Volunteer hours</li>
            <li style={{ fontSize: '13px', color: '#666' }}>Donate to causes</li>
            <li style={{ fontSize: '13px', color: '#666' }}>Complete surveys</li>
          </ul>
        </div>
      </div>

      {/* Transaction History */}
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111111', marginBottom: '16px' }}>Transaction History</h3>

        {wallet.transactions && wallet.transactions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600 }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {wallet.transactions.map((txn, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          backgroundColor: txn.type === 'earn' ? '#e8f5e9' : '#ffebee',
                          color: txn.type === 'earn' ? '#2e7d32' : '#c62828',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {txn.type === 'earn' ? '+' : '-'} {txn.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600 }}>
                      {txn.type === 'earn' ? '+' : '-'} AED {txn.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '13px', color: '#666' }}>
                      {txn.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: '#999' }}>No transactions yet</p>
        )}
      </div>
    </div>
  )
}
