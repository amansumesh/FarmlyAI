/**
 * Maps i18n language codes to BCP-47 locale strings for
 * toLocaleString / toLocaleDateString formatting.
 */
const LOCALE_MAP: Record<string, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    ml: 'ml-IN',
    te: 'te-IN',
    kn: 'kn-IN',
};

export function getLocale(languageCode: string): string {
    return LOCALE_MAP[languageCode] || 'en-IN';
}
