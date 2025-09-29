export const WORD_TYPES = [
  "Substantiv",
  "Verb",
  "Adjektiv",
  "Adverb",
  "Artikel",
  "Eigenname",
  "Interjektion",
  "Konjunktion",
  "Partikel",
  "Präposition",
  "Pronomen",
  "Zahlwort",
] as const;

export type WordType = (typeof WORD_TYPES)[number];
