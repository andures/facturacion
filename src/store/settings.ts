import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

interface SettingsState {
  businessName: string;
  taxId: string;
  address: string;
  currency: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  logoUri: string | null;
}

interface SettingsActions {
  setBusinessName: (v: string) => void;
  setTaxId: (v: string) => void;
  setAddress: (v: string) => void;
  setCurrency: (v: string) => void;
  setInvoicePrefix: (v: string) => void;
  incrementInvoiceNumber: () => void;
  setLogoUri: (v: string | null) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      businessName: '',
      taxId: '',
      address: '',
      currency: 'L.',
      invoicePrefix: 'F-',
      nextInvoiceNumber: 1,
      logoUri: null,

      setBusinessName: (v) => set({ businessName: v }),
      setTaxId: (v) => set({ taxId: v }),
      setAddress: (v) => set({ address: v }),
      setCurrency: (v) => set({ currency: v }),
      setInvoicePrefix: (v) => set({ invoicePrefix: v }),
      incrementInvoiceNumber: () =>
        set((s) => ({ nextInvoiceNumber: s.nextInvoiceNumber + 1 })),
      setLogoUri: (v) => set({ logoUri: v }),
    }),
    {
      name: 'facturacion-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const base = {
          businessName: state.businessName,
          taxId: state.taxId,
          address: state.address,
          invoicePrefix: state.invoicePrefix,
          nextInvoiceNumber: state.nextInvoiceNumber,
        };
        // On web, logoUri is a base64 string stored in Supabase — skip AsyncStorage
        if (Platform.OS !== 'web') return { ...base, logoUri: state.logoUri };
        return base;
      },
      merge: (persisted: unknown, current) => ({
        ...current,
        ...(persisted as object),
        currency: 'L.',
      }),
    }
  )
);
