import type es from "./es";

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Shape every language must implement (Spanish is the source). */
export type Translations = Widen<typeof es>;

type Leaves<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

type LeafKey = Leaves<Translations>;
type StripPlural<K> = K extends `${infer B}_one`
  ? B
  : K extends `${infer B}_other`
    ? B
    : K;

/** Any leaf key, or the base name of a pluralized key (resolved with `count`). */
export type TranslationKey = LeafKey | StripPlural<LeafKey>;

export type TranslationParams = Record<string, string | number>;

export type Language = "es" | "en";
