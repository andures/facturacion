import { supabase } from '@/src/utils/supabase';
import { useSettingsStore } from '@/src/store/settings';

let _syncTimeout: ReturnType<typeof setTimeout> | null = null;

function _syncToSupabase() {
  if (_syncTimeout) clearTimeout(_syncTimeout);
  _syncTimeout = setTimeout(async () => {
    const s = useSettingsStore.getState();
    const { error } = await supabase.from('settings').upsert({
      id: 'default',
      business_name: s.businessName,
      tax_id: s.taxId,
      address: s.address,
      invoice_prefix: s.invoicePrefix,
      next_invoice_number: s.nextInvoiceNumber,
      logo_data: s.logoUri,
    });
    if (error) console.warn('[supabase settings]', error.message);
  }, 600);
}

export async function loadSettings(): Promise<void> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error || !data) return;

  useSettingsStore.setState({
    businessName: data.business_name ?? '',
    taxId: data.tax_id ?? '',
    address: data.address ?? '',
    invoicePrefix: data.invoice_prefix ?? 'F-',
    nextInvoiceNumber: data.next_invoice_number ?? 1,
    logoUri: data.logo_data ?? null,
  }, false);
}

export function setupSettingsSync(): void {
  useSettingsStore.subscribe(() => _syncToSupabase());
}

/** Convert a blob/object URL → base64 data URL (web only) */
export async function uriToBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
