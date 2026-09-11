import { create } from 'zustand';
import type { SadaqahPaymentMethod } from '../types/api.js';

const today = (): string => new Date().toISOString().slice(0, 10);

export interface SadaqahFormFields {
  donorName: string;
  onBehalfOf: string;
  email: string;
  phone: string;
  paymentMethod: SadaqahPaymentMethod;
  transactionId: string;
  amount: string;
  transactionDate: string;
  message: string;
  showNamePublicly: boolean;
  isAnonymous: boolean;
}

const initialFields: SadaqahFormFields = {
  donorName: '',
  onBehalfOf: '',
  email: '',
  phone: '',
  paymentMethod: 'bkash',
  transactionId: '',
  amount: '',
  transactionDate: today(),
  message: '',
  showNamePublicly: false,
  isAnonymous: false,
};

interface SadaqahFormState extends SadaqahFormFields {
  setField: <K extends keyof SadaqahFormFields>(field: K, value: SadaqahFormFields[K]) => void;
  reset: () => void;
}

// A generic setField (rather than one setter per field, unlike useUiStore)
// since this form has ~10 fields — a dedicated setter each would be pure
// boilerplate here.
export const useSadaqahFormStore = create<SadaqahFormState>((set) => ({
  ...initialFields,
  setField: (field, value) => set({ [field]: value } as Partial<SadaqahFormFields>),
  reset: () => set({ ...initialFields, transactionDate: today() }),
}));
