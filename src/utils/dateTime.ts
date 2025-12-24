export class DateTime {
  // Days of the week in Irish
  private static readonly _irishDaysOfWeek: {[key: number]: string} = {
    0: 'Domhnach', // Sunday (0 in JS Date)
    1: 'Luan', // Monday
    2: 'Máirt', // Tuesday
    3: 'Céadaoin', // Wednesday
    4: 'Déardaoin', // Thursday
    5: 'Aoine', // Friday
    6: 'Satharn', // Saturday
  };

  // Months in Irish
  private static readonly _irishMonths: {[key: number]: string} = {
    0: 'Eanáir', // January (0 in JS Date)
    1: 'Feabhra',
    2: 'Márta',
    3: 'Aibreán',
    4: 'Bealtaine',
    5: 'Meitheamh',
    6: 'Iúil',
    7: 'Lúnasa',
    8: 'Meán Fómhair',
    9: 'Deireadh Fómhair',
    10: 'Samhain',
    11: 'Nollaig',
  };

  // Days of the week in English
  private static readonly _englishDaysOfWeek: {[key: number]: string} = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };

  // Months in English
  private static readonly _englishMonths: {[key: number]: string} = {
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December',
  };

  // Days of the week in Navajo
  private static readonly _navajoDaysOfWeek: {[key: number]: string} = {
    0: 'Yiską́įdą́ą́', // Sunday
    1: 'Damį́įgo Biiskání', // Monday
    2: 'Naakijį́ Damį́įgo', // Tuesday
    3: 'Tą́ą́jį́ Damį́įgo', // Wednesday
    4: 'Dį́įjį́ Damį́įgo', // Thursday
    5: 'Ałnį́ Damį́įgo', // Friday
    6: 'Yiską́go', // Saturday
  };

  // Months in Navajo
  private static readonly _navajoMonths: {[key: number]: string} = {
    0: 'Yas Niltʼees', // January
    1: 'Atsá Biyáázh', // February
    2: 'Wóózhchʼį́į́d', // March
    3: 'Tʼą́ą́chil', // April
    4: 'Tʼą́ą́tsoh', // May
    5: 'Yaʼiishjááshchilí', // June
    6: 'Yaʼiishjáástsoh', // July
    7: 'Biniʼantʼą́ą́ts', // August
    8: 'Biniʼantʼą́ą́tsʼózí', // September
    9: 'Ghąąjį́', // October
    10: 'Níłchʼitsʼósí', // November
    11: 'Níłchʼitsoh', // December
  };

  // Days of the week in Māori
  private static readonly _maoriDaysOfWeek: {[key: number]: string} = {
    0: 'Rātapu', // Sunday
    1: 'Rāhina', // Monday
    2: 'Rātū', // Tuesday
    3: 'Rāapa', // Wednesday
    4: 'Rāpare', // Thursday
    5: 'Rāmere', // Friday
    6: 'Rāhoroi', // Saturday
  };

  // Months in Māori
  private static readonly _maoriMonths: {[key: number]: string} = {
    0: 'Kohi-tātea', // January
    1: 'Hui-tanguru', // February
    2: 'Poutū-te-rangi', // March
    3: 'Paenga-whāwhā', // April
    4: 'Haratua', // May
    5: 'Pipiri', // June
    6: 'Hōngongoi', // July
    7: 'Here-turi-kōkā', // August
    8: 'Mahuru', // September
    9: 'Whiringa-ā-nuku', // October
    10: 'Whiringa-ā-rangi', // November
    11: 'Hakihea', // December
  };

  // Hours in Irish (special cases for time)
  private static readonly _irishHours: {[key: number]: string} = {
    1: 'a haon',
    2: 'a dó',
    3: 'a trí',
    4: 'a ceathair',
    5: 'a cúig',
    6: 'a sé',
    7: 'a seacht',
    8: 'a hocht',
    9: 'a naoi',
    10: 'a deich',
    11: 'a haon déag',
    12: 'a dó dhéag',
  };

  /// Gets the days of week for a given language
  private static _getDaysOfWeek(languageId: string): {[key: number]: string} {
    if (languageId === 'navajo') {
      return this._navajoDaysOfWeek;
    } else if (languageId === 'maori') {
      return this._maoriDaysOfWeek;
    } else if (languageId.startsWith('irish')) {
      return this._irishDaysOfWeek;
    }
    return this._englishDaysOfWeek;
  }

  /// Gets the months for a given language
  private static _getMonths(languageId: string): {[key: number]: string} {
    if (languageId === 'navajo') {
      return this._navajoMonths;
    } else if (languageId === 'maori') {
      return this._maoriMonths;
    } else if (languageId.startsWith('irish')) {
      return this._irishMonths;
    }
    return this._englishMonths;
  }

  /// Gets the current day of the week in Irish
  static getCurrentDayInIrish(): string {
    const now = new Date();
    return this._irishDaysOfWeek[now.getDay()] ?? 'Lá';
  }

  /// Gets the current month in Irish
  static getCurrentMonthInIrish(): string {
    const now = new Date();
    return this._irishMonths[now.getMonth()] ?? 'Mí';
  }

  /// Gets the current date in Irish format
  /// Example: "Luan, an 12ú lá de Mhárta"
  static getCurrentDateInIrish(): string {
    const now = new Date();
    const day = this.getCurrentDayInIrish();
    const dayNumber = this._getOrdinalDayInIrish(now.getDate());
    const month = this.getCurrentMonthInIrish();

    let preposition = 'de ';
    let processedMonth = month;

    const vowels = ['A', 'E', 'I', 'O', 'U', 'Á', 'É', 'Í', 'Ó', 'Ú'];
    const lowerVowels = ['a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú'];
    const lenitable = ['B', 'C', 'D', 'G', 'M', 'P', 'S', 'T']; // F is special

    if (
      vowels.includes(month[0]) ||
      (month[0] === 'F' && lowerVowels.includes(month[1] || ''))
    ) {
      // d'Aibreán, d'Fheabhra (if F is followed by vowel, F is lenited to Fh, which is silent, so d')
      if (month[0] === 'F') {
        preposition = "d'";
        processedMonth = 'Fh' + month.slice(1);
      } else {
        preposition = "d'";
      }
    } else if (lenitable.includes(month[0])) {
      processedMonth = month[0] + 'h' + month.slice(1);
    }

    return `${day}, ${dayNumber} ${preposition}${processedMonth}`;
  }

  /// Gets the current date in English format
  /// Example: "Monday, 12th of March"
  static getCurrentDateInEnglish(): string {
    const now = new Date();
    const day = this._englishDaysOfWeek[now.getDay()] ?? 'Day';
    const dayNumber = this._getOrdinalDayInEnglish(now.getDate());
    const month = this._englishMonths[now.getMonth()] ?? 'Month';

    return `${day}, ${dayNumber} of ${month}`;
  }

  /// Gets ordinal day in English (1st, 2nd, etc.)
  private static _getOrdinalDayInEnglish(day: number): string {
    if (day >= 11 && day <= 13) {
      return `${day}th`; // 11th, 12th, 13th
    }

    switch (day % 10) {
      case 1:
        return `${day}st`; // 1st, 21st, 31st
      case 2:
        return `${day}nd`; // 2nd, 22nd
      case 3:
        return `${day}rd`; // 3rd, 23rd
      default:
        return `${day}th`; // 4th, 5th, etc.
    }
  }

  /// Gets ordinal day in Irish (1st, 2nd, etc.)
  private static _getOrdinalDayInIrish(day: number): string {
    switch (day) {
      case 1:
        return 'an chéad lá';
      case 2:
        return 'an dara lá';
      case 3:
        return 'an tríú lá';
      case 4:
        return 'an ceathrú lá';
      default:
        return `an ${day}ú lá`;
    }
  }

  /// Gets the current time in Irish
  /// Example: "a trí a chlog" (3 o'clock)
  static getCurrentTimeInIrish(): string {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;

    let timeString = '';

    // Handle exact hours
    if (minute === 0) {
      timeString = `Tá sé ${this._irishHours[hour12]} a chlog`;
    }
    // Handle common minute intervals
    else if (minute === 15) {
      timeString = `Tá sé ceathrú tar éis ${this._irishHours[hour12]}`;
    } else if (minute === 30) {
      timeString = `Tá sé leathuair tar éis ${this._irishHours[hour12]}`;
    } else if (minute === 45) {
      const nextHour = hour12 === 12 ? 1 : hour12 + 1;
      timeString = `Tá sé ceathrú chun ${this._irishHours[nextHour]}`;
    }
    // Handle other minutes
    else {
      const hourWord = this._irishHours[hour12];
      if (minute <= 30) {
        const minuteWord = this._getMinuteInIrish(minute);
        timeString = `Tá sé ${minuteWord} tar éis ${hourWord}`;
      } else {
        const minutesToNext = 60 - minute;
        const minuteWord = this._getMinuteInIrish(minutesToNext);
        const nextHour = hour12 === 12 ? 1 : hour12 + 1;
        timeString = `Tá sé ${minuteWord} chun ${this._irishHours[nextHour]}`;
      }
    }

    return timeString;
  }

  /// Gets the current time in English
  /// Example: "3:20 PM"
  static getCurrentTimeInEnglish(): string {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const minuteStr = minute.toString().padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';

    return `${hour12}:${minuteStr} ${ampm}`;
  }

  /// Convert minute number to Irish word
  private static _getMinuteInIrish(minute: number): string {
    // Handle special cases
    switch (minute) {
      case 1:
        return 'nóiméad amháin';
      case 2:
        return 'dhá nóiméad';
      case 3:
        return 'trí nóiméad';
      case 4:
        return 'ceithre nóiméad';
    }
    // Handle 5-10
    if (minute >= 5 && minute <= 10) {
      const numbersMap: {[key: number]: string} = {
        5: 'cúig',
        6: 'sé',
        7: 'seacht',
        8: 'ocht',
        9: 'naoi',
        10: 'deich',
      };
      return `${numbersMap[minute]} nóiméad`;
    }

    // Handle 11-14
    if (minute >= 11 && minute <= 14) {
      const numbersMap: {[key: number]: string} = {
        11: 'aon',
        12: 'dhá',
        13: 'trí',
        14: 'ceithre',
      };
      return `${numbersMap[minute]} nóiméad déag`;
    }

    // Handle 15
    if (minute === 15) {
      return 'cúig nóiméad déag';
    }

    // Handle 16-19
    if (minute >= 16 && minute <= 19) {
      const numbersMap: {[key: number]: string} = {
        16: 'sé',
        17: 'seacht',
        18: 'ocht',
        19: 'naoi',
      };
      return `${numbersMap[minute]} nóiméad déag`;
    }

    // Handle 20
    if (minute === 20) {
      return 'fiche nóiméad';
    }

    // Handle 21-29
    if (minute >= 21 && minute <= 29) {
      const unit = minute % 10;
      let unitPhrase;

      if (unit === 1) {
        unitPhrase = 'haon';
      } else if (unit === 2) {
        unitPhrase = 'dó';
      } else if (unit === 3) {
        unitPhrase = 'trí';
      } else if (unit === 4) {
        unitPhrase = 'ceathair';
      } else if (unit === 5) {
        unitPhrase = 'cúig';
      } else if (unit === 6) {
        unitPhrase = 'sé';
      } else if (unit === 7) {
        unitPhrase = 'seacht';
      } else if (unit === 8) {
        unitPhrase = 'hocht';
      } else {
        unitPhrase = 'naoi';
      }

      return `fiche a ${unitPhrase} nóiméad`;
    }

    // Handle 30
    if (minute === 30) {
      return 'leathuair';
    }

    return `${minute} nóiméad`; // Fallback
  }

  /// Gets the current date in the specified language format
  static getCurrentDate(languageId: string): string {
    if (languageId.startsWith('irish')) {
      return this.getCurrentDateInIrish();
    } else if (languageId === 'navajo') {
      return this._getStandardDate(this._navajoDaysOfWeek, this._navajoMonths);
    } else if (languageId === 'maori') {
      return this._getStandardDate(this._maoriDaysOfWeek, this._maoriMonths);
    }
    return this.getCurrentDateInEnglish();
  }

  /// Gets the current time in the specified language format
  static getCurrentTime(languageId: string): string {
    if (languageId.startsWith('irish')) {
      return this.getCurrentTimeInIrish();
    }
    // For non-Irish languages, use standard time format
    return this.getCurrentTimeInEnglish();
  }

  /// Helper to get standard date format (Day, Day# Month) for non-Irish languages
  private static _getStandardDate(
    daysOfWeek: {[key: number]: string},
    months: {[key: number]: string},
  ): string {
    const now = new Date();
    const day = daysOfWeek[now.getDay()] ?? 'Day';
    const dayNumber = now.getDate();
    const month = months[now.getMonth()] ?? 'Month';

    return `${day}, ${dayNumber} ${month}`;
  }
}
