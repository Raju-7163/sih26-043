/**
 * Utility to auto-detect language from script and Unicode character ranges.
 * Supports Indian languages (Hindi, Bengali, Tamil, Telugu, Kannada, Malayalam, Gujarati, Punjabi, Odia) and English.
 */

export interface LanguageDetectionResult {
  code: string;
  name: string;
  nativeName: string;
  script: string;
}

export function detectLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' };
  }

  const sample = text.trim();

  // Devanagari range (Hindi, Marathi, Sanskrit, etc.)
  const devanagariCount = (sample.match(/[\u0900-\u097F]/g) || []).length;
  // Bengali / Assamese range
  const bengaliCount = (sample.match(/[\u0980-\u09FF]/g) || []).length;
  // Gurmukhi (Punjabi)
  const gurmukhiCount = (sample.match(/[\u0A00-\u0A7F]/g) || []).length;
  // Gujarati
  const gujaratiCount = (sample.match(/[\u0A80-\u0AFF]/g) || []).length;
  // Odia
  const odiaCount = (sample.match(/[\u0B00-\u0B7F]/g) || []).length;
  // Tamil
  const tamilCount = (sample.match(/[\u0B80-\u0BFF]/g) || []).length;
  // Telugu
  const teluguCount = (sample.match(/[\u0C00-\u0C7F]/g) || []).length;
  // Kannada
  const kannadaCount = (sample.match(/[\u0C80-\u0CFF]/g) || []).length;
  // Malayalam
  const malayalamCount = (sample.match(/[\u0D00-\u0D7F]/g) || []).length;

  const counts = [
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', count: devanagariCount },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', count: bengaliCount },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', count: gurmukhiCount },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', count: gujaratiCount },
    { code: 'or', name: 'Odia', nativeName: 'ওড়িয়া', script: 'Odia', count: odiaCount },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', count: tamilCount },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', count: teluguCount },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', count: kannadaCount },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', count: malayalamCount },
  ];

  counts.sort((a, b) => b.count - a.count);

  if (counts[0].count > 0) {
    return {
      code: counts[0].code,
      name: counts[0].name,
      nativeName: counts[0].nativeName,
      script: counts[0].script
    };
  }

  return { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' };
}
