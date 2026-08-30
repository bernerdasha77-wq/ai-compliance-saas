'use client';

import { useState } from 'react';
import { useAuth } from './auth-context';
import { ANALYZE_SUSPENDED, SUSPENSION_MESSAGE } from './maintenance';

export type Tariff = 'one_time' | 'basic' | 'pro';

export function usePaymentTrigger() {
  const { token, openAuth } = useAuth();
  const [loadingTariff, setLoadingTariff] = useState<Tariff | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startPayment = async (tariff: Tariff) => {
    if (ANALYZE_SUSPENDED) {
      setError(SUSPENSION_MESSAGE);
      return;
    }
    if (!token) {
      openAuth();
      return;
    }
    setError(null);
    setLoadingTariff(tariff);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ai-compliance-saas-6nz5.onrender.com';
      const response = await fetch(`${apiUrl}/api/payments/create?tariff=${tariff}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      window.location.href = data.confirmation_url;
    } catch {
      setError('Не удалось создать платёж. Попробуйте ещё раз.');
      setLoadingTariff(null);
    }
  };

  return { startPayment, loadingTariff, error };
}
