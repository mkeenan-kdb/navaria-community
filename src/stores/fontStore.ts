import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createStorage} from '@/services/storage';

export interface FontState {
  // State
  currentFont: string;
  availableFonts: Record<string, string>;

  // Actions
  setFont: (fontName: string) => void;
  resetFont: () => void;
  getFontsForLanguage: (languageId: string) => Record<string, string>;
}

export const DEFAULT_FONT = 'System';

// Standard fonts available for all languages
export const STANDARD_FONTS = {
  System: 'System',
};

// Irish-specific Celtic fonts
export const IRISH_FONTS = {
  Meath: 'MeathFLF',
  Ard: 'Ardchlo GC',
  Bun: 'Bunchlo GC',
  Gear: 'Gearchlo GC',
  Glan: 'Glanchlo GC',
  Mear: 'Mearchlo GC',
  Mion: 'Mionchlo GC',
  Sráid: 'Sraidchlo GC',
};

// All available fonts - exported for usage checks
export const AVAILABLE_FONTS = {...STANDARD_FONTS, ...IRISH_FONTS};

export const useFontStore = create<FontState>()(
  persist(
    set => ({
      // Initial state
      currentFont: DEFAULT_FONT,
      availableFonts: AVAILABLE_FONTS, // Default to showing all for now

      // Actions
      setFont: (fontName: string) => {
        set({currentFont: fontName});
      },

      resetFont: () => {
        set({currentFont: DEFAULT_FONT});
      },

      getFontsForLanguage: (languageId: string) => {
        if (languageId && languageId.startsWith('irish')) {
          return {...STANDARD_FONTS, ...IRISH_FONTS};
        }
        // For other languages (Navajo, Maori), just return standard fonts for now
        // We can add language-specific fonts here later
        return STANDARD_FONTS;
      },
    }),
    {
      name: 'font-storage',
      storage: createJSONStorage(() => createStorage('font-storage')),
    },
  ),
);

// Helper to check if a font is valid for the current language
export const isFontValidForLanguage = (font: string, languageId: string) => {
  const store = useFontStore.getState();
  const validFonts = store.getFontsForLanguage(languageId);
  return Object.values(validFonts).includes(font);
};
