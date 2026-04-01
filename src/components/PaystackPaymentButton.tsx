import React from 'react'
// @ts-ignore
import PaystackPop from '@paystack/inline-js'
import { toast } from 'sonner'

interface PaystackPaymentButtonProps {
  email: string
  amount: number
  onSuccess: (reference: any) => void
  onClose: () => void
  className?: string
  children: React.ReactNode
}

export default function PaystackPaymentButton({
  email,
  amount,
  onSuccess,
  onClose,
  className,
  children
}: PaystackPaymentButtonProps) {
  // In Vite we use import.meta.env
  const paystackKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || ''

  const handleConfirmPayment = () => {
    if (!paystackKey) {
      toast.error('Payment gateway missing public key configuration.')
      return
    }

    const paystack = new PaystackPop()
    paystack.newTransaction({
      key: paystackKey,
      email: email,
      amount: amount * 100, // Paystack expects amount in pesewas (GHS 25 = 2500)
      currency: 'GHS',
      onSuccess: (transaction: any) => {
        // console.log('Transaction Successful:', transaction.reference)
        onSuccess(transaction)
      },
      onCancel: () => {
        // console.log('Transaction Cancelled')
        onClose()
      }
    })
  }

  return (
    <button onClick={handleConfirmPayment} className={className}>
      {children}
    </button>
  )
}
