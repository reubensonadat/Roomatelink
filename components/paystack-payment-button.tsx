"use client";

import React from 'react';
// @ts-ignore - react-paystack doesn't have official TS types
import { usePaystackPayment } from 'react-paystack';
import { Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface PaystackPaymentButtonProps {
  email: string;
  amount: number;
  onSuccess: (reference: any) => void;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
}

export default function PaystackPaymentButton({
  email,
  amount,
  onSuccess,
  onClose,
  className,
  children
}: PaystackPaymentButtonProps) {
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_LIVE_KEY 
    ? process.env.NEXT_PUBLIC_PAYSTACK_LIVE_KEY 
    : (process.env.NEXT_PUBLIC_PAYSTACK_TEST_KEY || '');

  const config = {
    reference: (new Date()).getTime().toString() + Math.floor(Math.random() * 1000000),
    email: email,
    amount: amount * 100, // Paystack requires amount in pesewas
    currency: 'GHS',
    publicKey: paystackKey,
  };

  const initializePayment = usePaystackPayment(config);

  const handleConfirmPayment = () => {
    if (!config.publicKey) {
      toast.error('Payment gateway missing public key configuration.');
      return;
    }
    initializePayment({ onSuccess, onClose });
  };

  return (
    <button onClick={handleConfirmPayment} className={className}>
      {children}
    </button>
  );
}
