import { Platform } from 'react-native';

export async function exportInvoicePdf(html: string, numero: string): Promise<void> {
  if (Platform.OS === 'web') {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 400);
    }
    return;
  }
  const [Print, Sharing] = await Promise.all([
    import('expo-print'),
    import('expo-sharing'),
  ]);
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Compartir ${numero}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
