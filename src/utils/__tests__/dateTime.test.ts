import {DateTime} from '../dateTime';

describe('DateTime', () => {
  // Helper to set the system time
  const setSystemTime = (dateString: string) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(dateString));
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCurrentDayInIrish', () => {
    it('returns correct day names', () => {
      setSystemTime('2023-10-23T12:00:00'); // Monday
      expect(DateTime.getCurrentDayInIrish()).toBe('Luan');

      setSystemTime('2023-10-24T12:00:00'); // Tuesday
      expect(DateTime.getCurrentDayInIrish()).toBe('Máirt');

      setSystemTime('2023-10-29T12:00:00'); // Sunday
      expect(DateTime.getCurrentDayInIrish()).toBe('Domhnach');
    });
  });

  describe('getCurrentMonthInIrish', () => {
    it('returns correct month names', () => {
      setSystemTime('2023-01-01T12:00:00');
      expect(DateTime.getCurrentMonthInIrish()).toBe('Eanáir');

      setSystemTime('2023-12-25T12:00:00');
      expect(DateTime.getCurrentMonthInIrish()).toBe('Nollaig');
    });
  });

  describe('getCurrentDateInIrish', () => {
    it('formats date correctly with lenition', () => {
      // Monday, 23rd October (Deireadh Fómhair - starts with D, lenitable)
      setSystemTime('2023-10-23T12:00:00');
      // 23rd -> 23ú
      // de + Deireadh Fómhair -> de Dheireadh Fómhair
      expect(DateTime.getCurrentDateInIrish()).toBe(
        'Luan, an 23ú lá de Dheireadh Fómhair',
      );
    });

    it('handles vowel start (Aibreán)', () => {
      // Saturday, 1st April 2023
      setSystemTime('2023-04-01T12:00:00');
      // 1st -> an chéad lá
      // de + Aibreán -> d'Aibreán
      expect(DateTime.getCurrentDateInIrish()).toBe(
        "Satharn, an chéad lá d'Aibreán",
      );
    });

    it('handles F followed by vowel (Feabhra)', () => {
      // Wednesday, 1st February 2023
      setSystemTime('2023-02-01T12:00:00');
      // de + Feabhra -> d'Fheabhra
      expect(DateTime.getCurrentDateInIrish()).toBe(
        "Céadaoin, an chéad lá d'Fheabhra",
      );
    });

    it('handles ordinal days correctly', () => {
      setSystemTime('2023-01-01T12:00:00'); // 1st
      expect(DateTime.getCurrentDateInIrish()).toContain('an chéad lá');

      setSystemTime('2023-01-02T12:00:00'); // 2nd
      expect(DateTime.getCurrentDateInIrish()).toContain('an dara lá');

      setSystemTime('2023-01-03T12:00:00'); // 3rd
      expect(DateTime.getCurrentDateInIrish()).toContain('an tríú lá');

      setSystemTime('2023-01-04T12:00:00'); // 4th
      expect(DateTime.getCurrentDateInIrish()).toContain('an ceathrú lá');

      setSystemTime('2023-01-05T12:00:00'); // 5th
      expect(DateTime.getCurrentDateInIrish()).toContain('an 5ú lá');
    });
  });

  describe('getCurrentTimeInIrish', () => {
    it("handles exact hours (o'clock)", () => {
      setSystemTime('2023-01-01T03:00:00');
      expect(DateTime.getCurrentTimeInIrish()).toBe('Tá sé a trí a chlog');

      setSystemTime('2023-01-01T15:00:00'); // 3 PM
      expect(DateTime.getCurrentTimeInIrish()).toBe('Tá sé a trí a chlog');
    });

    it('handles quarter past', () => {
      setSystemTime('2023-01-01T04:15:00');
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé ceathrú tar éis a ceathair',
      );
    });

    it('handles half past', () => {
      setSystemTime('2023-01-01T05:30:00');
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé leathuair tar éis a cúig',
      );
    });

    it('handles quarter to', () => {
      setSystemTime('2023-01-01T06:45:00');
      // Quarter to 7
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé ceathrú chun a seacht',
      );
    });

    it('handles minutes past (<= 30)', () => {
      setSystemTime('2023-01-01T07:10:00');
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé deich nóiméad tar éis a seacht',
      );

      setSystemTime('2023-01-01T07:20:00');
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé fiche nóiméad tar éis a seacht',
      );

      setSystemTime('2023-01-01T07:25:00');
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé fiche a cúig nóiméad tar éis a seacht',
      ); // Wait, let's check logic
      // 25 -> fiche a cúig nóiméad
    });

    it('handles minutes to (> 30)', () => {
      setSystemTime('2023-01-01T08:50:00');
      // 10 minutes to 9
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé deich nóiméad chun a naoi',
      );

      setSystemTime('2023-01-01T08:35:00');
      // 25 minutes to 9
      // 60 - 35 = 25
      // fiche a cúig nóiméad
      expect(DateTime.getCurrentTimeInIrish()).toContain(
        'fiche a cúig nóiméad chun a naoi',
      );
    });

    it('handles midnight/noon crossover', () => {
      setSystemTime('2023-01-01T12:45:00'); // 12:45 PM -> Quarter to 1
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé ceathrú chun a haon',
      );

      setSystemTime('2023-01-01T23:45:00'); // 11:45 PM -> Quarter to 12
      expect(DateTime.getCurrentTimeInIrish()).toBe(
        'Tá sé ceathrú chun a dó dhéag',
      );
    });
  });

  describe('getCurrentTimeInEnglish', () => {
    it('formats time correctly', () => {
      setSystemTime('2023-01-01T14:05:00');
      expect(DateTime.getCurrentTimeInEnglish()).toBe('2:05 PM');

      setSystemTime('2023-01-01T09:30:00');
      expect(DateTime.getCurrentTimeInEnglish()).toBe('9:30 AM');
    });
  });

  describe('getCurrentDate - multi-language', () => {
    it('returns Irish date when language is Irish', () => {
      setSystemTime('2023-10-23T12:00:00');
      expect(DateTime.getCurrentDate('irish_std')).toBe(
        'Luan, an 23ú lá de Dheireadh Fómhair',
      );
    });

    it('returns Navajo date when language is Navajo', () => {
      setSystemTime('2023-10-23T12:00:00'); // Monday
      const date = DateTime.getCurrentDate('navajo');
      expect(date).toContain('Damį́įgo Biiskání'); // Monday in Navajo
      expect(date).toContain('Ghąąjį́'); // October in Navajo
      expect(date).toContain('23');
    });

    it('returns Māori date when language is Māori', () => {
      setSystemTime('2023-10-23T12:00:00'); // Monday
      const date = DateTime.getCurrentDate('maori');
      expect(date).toContain('Rāhina'); // Monday in Māori
      expect(date).toContain('Whiringa-ā-nuku'); // October in Māori
      expect(date).toContain('23');
    });

    it('returns English date for unknown language', () => {
      setSystemTime('2023-10-23T12:00:00');
      const date = DateTime.getCurrentDate('unknown');
      expect(date).toBe('Monday, 23rd of October');
    });
  });

  describe('getCurrentTime - multi-language', () => {
    it('returns Irish time when language is Irish', () => {
      setSystemTime('2023-01-01T03:00:00');
      expect(DateTime.getCurrentTime('irish_std')).toBe('Tá sé a trí a chlog');
    });

    it('returns English time for non-Irish languages', () => {
      setSystemTime('2023-01-01T14:05:00');
      expect(DateTime.getCurrentTime('navajo')).toBe('2:05 PM');
      expect(DateTime.getCurrentTime('maori')).toBe('2:05 PM');
    });
  });
});
