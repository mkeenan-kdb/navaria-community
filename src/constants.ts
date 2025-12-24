export const ANIMATION = {
  DURATION: {
    FAST: 200,
    NORMAL: 300,
    SLOW: 1000,
    VERY_SLOW: 1500,
    SHAKE: 300,
    PULSE: 1000,
  },
  SCALE: {
    PRESSED: 0.95,
    FOCUSED: 1.1,
  },
};

export const TIMING = {
  SENTENCE_TRANSITION_DELAY: 1000,
  ACHIEVEMENT_CHECK_DELAY: 1000,
  ERROR_CLEAR_DELAY: 250, // Reduced from 350ms for better responsiveness
  CONFETTI_DURATION: 4000,
  DEBOUNCE: {
    SEARCH: 300,
    INPUT: 100,
  },
};

export const GAMEPLAY = {
  XP: {
    CORRECT_WORD: 10, // increased from 5
    MATCH_PAIR: 5,
    CLOZE_BLANK: 5, // per blank
    LESSON_COMPLETION: 50,
    NO_MISTAKES_BONUS: 2,
    NO_HELP_BONUS: 2,
    REPEAT_BONUS: 5,
    MAX_REPEAT_BONUS: 50,
  },
};

export const LANGUAGES = [
  {id: 'irish_std', name: 'Irish (Standard)', code: 'ga'},
  {id: 'irish_mun', name: 'Irish (Munster)', code: 'ga-mun'},
  {id: 'irish_con', name: 'Irish (Connacht)', code: 'ga-con'},
  {id: 'irish_ul', name: 'Irish (Ulster)', code: 'ga-ul'},
  {id: 'navajo', name: 'Navajo', code: 'nv'},
  {id: 'maori', name: 'Māori', code: 'mi'},
];
