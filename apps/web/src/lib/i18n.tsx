'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Lang } from './types';

/** Shape of the UI copy (identical for every language). */
export interface Strings {
  nav: { check: string; matrix: string; reverse: string; audit: string; subtitle: string };
  home: { kicker: string; title: string; subtitle: string };
  check: { ready: string; choose: string; button: string; loadError: string; failed: string };
  select: {
    press: string;
    mold: string;
    pressPlaceholder: string;
    moldPlaceholder: string;
    search: string;
    noMatch: string;
  };
  result: {
    compatible: string;
    notCompatible: string;
    press: string;
    mold: string;
    blockedBy: (n: number) => string;
    adaptation: string;
    allPassed: string;
  };
  chip: {
    pass: string;
    fail: string;
    adaptation: string;
    compatible: string;
    notCompatible: string;
    compatibleAdaptation: string;
  };
  matrix: { title: string; subtitle: string; summary: (ok: number, total: number) => string };
  reverse: { title: string; subtitle: string; summary: (ok: number, total: number) => string };
  audit: {
    title: string;
    subtitle: string;
    empty: string;
    when: string;
    user: string;
    press: string;
    mold: string;
    result: string;
  };
  common: { evaluating: string; close: string; details: string };
}

/** All UI copy, keyed by language. Rule explanations are localized in engine.ts. */
const STRINGS: Record<Lang, Strings> = {
  fr: {
    nav: { check: 'Vérifier', matrix: 'Matrice', reverse: 'Recherche inverse', audit: 'Audit', subtitle: 'Moule ↔ Presse' },
    home: {
      kicker: 'Hénin-Beaumont',
      title: 'Ce moule peut-il tourner sur cette presse ?',
      subtitle:
        'Choisissez une presse et un moule. Obtenez une décision de montabilité instantanée et entièrement expliquée — chaque règle, chaque jeu, chaque adaptation requise.',
    },
    check: {
      ready: 'Prêt à évaluer les 10 règles.',
      choose: 'Choisissez une presse et un moule.',
      button: 'Vérifier la compatibilité',
      loadError: 'Échec du chargement des données',
      failed: 'Échec de la vérification',
    },
    select: {
      press: 'Presse',
      mold: 'Moule',
      pressPlaceholder: 'Sélectionner une presse',
      moldPlaceholder: 'Sélectionner un moule',
      search: 'Rechercher…',
      noMatch: 'Aucun résultat',
    },
    result: {
      compatible: 'COMPATIBLE',
      notCompatible: 'NON COMPATIBLE',
      press: 'Presse',
      mold: 'Moule',
      blockedBy: (n: number) => `Bloqué par ${n} règle${n > 1 ? 's' : ''} : `,
      adaptation: 'Montable avec une adaptation — voir les étapes en surbrillance ci-dessous.',
      allPassed: 'Toutes les vérifications sont passées. Prêt à monter.',
    },
    chip: {
      pass: 'Réussi',
      fail: 'Échec',
      adaptation: 'Adaptation',
      compatible: 'Compatible',
      notCompatible: 'Non compatible',
      compatibleAdaptation: 'Compatible · adaptation',
    },
    matrix: {
      title: 'Matrice de compatibilité',
      subtitle: 'Tester un moule contre toutes les presses.',
      summary: (ok: number, total: number) => `${ok} presse${ok > 1 ? 's' : ''} compatible${ok > 1 ? 's' : ''} sur ${total}.`,
    },
    reverse: {
      title: 'Recherche inverse',
      subtitle: 'Trouver tous les moules qui montent sur une presse donnée.',
      summary: (ok: number, total: number) => `${ok} moule${ok > 1 ? 's' : ''} compatible${ok > 1 ? 's' : ''} sur ${total}.`,
    },
    audit: {
      title: "Historique d'audit",
      subtitle: 'Chaque vérification est enregistrée pour la traçabilité (sur ce navigateur).',
      empty: 'Aucune vérification enregistrée.',
      when: 'Date',
      user: 'Utilisateur',
      press: 'Presse',
      mold: 'Moule',
      result: 'Résultat',
    },
    common: { evaluating: 'Évaluation…', close: 'Fermer', details: 'Détails' },
  },
  en: {
    nav: { check: 'Check', matrix: 'Matrix', reverse: 'Reverse', audit: 'Audit', subtitle: 'Mold ↔ Press' },
    home: {
      kicker: 'Hénin-Beaumont',
      title: 'Can this mold run on this press?',
      subtitle:
        'Pick a press and a mold. Get an instant, fully explained mountability decision — every rule, every clearance, every required adaptation.',
    },
    check: {
      ready: 'Ready to evaluate all 10 rules.',
      choose: 'Choose a press and a mold.',
      button: 'Check Compatibility',
      loadError: 'Failed to load data',
      failed: 'Check failed',
    },
    select: {
      press: 'Press',
      mold: 'Mold',
      pressPlaceholder: 'Select a press',
      moldPlaceholder: 'Select a mold',
      search: 'Search…',
      noMatch: 'No matches',
    },
    result: {
      compatible: 'COMPATIBLE',
      notCompatible: 'NOT COMPATIBLE',
      press: 'Press',
      mold: 'Mold',
      blockedBy: (n: number) => `Blocked by ${n} rule${n > 1 ? 's' : ''}: `,
      adaptation: 'Mountable with an adaptation — see the highlighted steps below.',
      allPassed: 'All checks passed. Ready to mount.',
    },
    chip: {
      pass: 'Pass',
      fail: 'Fail',
      adaptation: 'Adaptation',
      compatible: 'Compatible',
      notCompatible: 'Not compatible',
      compatibleAdaptation: 'Compatible · adaptation',
    },
    matrix: {
      title: 'Compatibility matrix',
      subtitle: 'Test one mold against every press.',
      summary: (ok: number, total: number) => `${ok} of ${total} presses are compatible.`,
    },
    reverse: {
      title: 'Reverse search',
      subtitle: 'Find every mold that fits a given press.',
      summary: (ok: number, total: number) => `${ok} of ${total} molds are compatible.`,
    },
    audit: {
      title: 'Audit history',
      subtitle: 'Every compatibility check is recorded for traceability (on this browser).',
      empty: 'No checks recorded yet.',
      when: 'When',
      user: 'User',
      press: 'Press',
      mold: 'Mold',
      result: 'Result',
    },
    common: { evaluating: 'Evaluating…', close: 'Close', details: 'Details' },
  },
};

interface I18nState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
}

const I18nContext = createContext<I18nState>({ lang: 'fr', setLang: () => {}, t: STRINGS.fr });
const LANG_KEY = 'mpc.lang';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('fr');

  useEffect(() => {
    const stored = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored === 'fr' || stored === 'en') setLangState(stored);
    else {
      const browser = navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'fr';
      setLangState(browser);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(LANG_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const value = useMemo<I18nState>(() => ({ lang, setLang, t: STRINGS[lang] }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
