import { ptBR } from './locales/pt-BR';
import { en } from './locales/en';
import type { Locale, Translations } from './types';

export * from './types';

export const dictionaries: Record<Locale, Translations> = {
  'pt-BR': ptBR,
  en,
};

/**
 * Detects device/browser locale:
 * If Portuguese (pt, pt-BR, pt-PT), defaults to 'pt-BR'.
 * Otherwise defaults to 'en'.
 */
export function detectDeviceLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  try {
    const navLangs = navigator.languages || [navigator.language];
    for (const lang of navLangs) {
      if (lang && lang.toLowerCase().startsWith('pt')) {
        return 'pt-BR';
      }
    }
  } catch {
    // fallback
  }

  return 'en';
}

/**
 * Translates known API errors to the user's language.
 */
export function translateApiError(errorMessage: string, locale: Locale): string {
  const t = dictionaries[locale].errors;
  const lower = errorMessage.toLowerCase();

  if (lower.includes('unauthorized') || lower.includes('não autorizado')) {
    return t.unauthorized;
  }
  if (lower.includes('invalid or expired') || lower.includes('expirada')) {
    return t.invalidToken;
  }
  if (lower.includes('user not found') || lower.includes('usuário não encontrado')) {
    return t.userNotFound;
  }
  if (lower.includes('preset not found') || lower.includes('preset não encontrado')) {
    return t.presetNotFound;
  }
  if (lower.includes('no tracks found') || lower.includes('nenhuma música')) {
    return t.noTracksFound;
  }
  if (lower.includes('no full albums found') || lower.includes('nenhum álbum completo')) {
    return t.noAlbumsFound.replace('{name}', '');
  }
  if (lower.includes('no singles') || lower.includes('nenhum single')) {
    return t.noSinglesFound.replace('{name}', '');
  }
  if (lower.includes('daily limit reached') || lower.includes('limite diário')) {
    let cat = 'música / álbuns';
    if (lower.includes('single')) cat = locale === 'pt-BR' ? 'singles e EPs' : 'singles & EPs';
    else if (lower.includes('album')) cat = locale === 'pt-BR' ? 'álbuns' : 'albums';
    else if (lower.includes('track')) cat = locale === 'pt-BR' ? 'músicas' : 'tracks';
    return t.dailyLimitReached.replace('{category}', cat);
  }
  if (lower.includes('auth') && lower.includes('fail')) {
    return t.authFailed;
  }

  return errorMessage;
}
