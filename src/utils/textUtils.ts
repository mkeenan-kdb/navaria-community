export function tokenizeIrishText(text: string): string[] {
  const tokenPattern =
    /([a-zA-Z0-9áéíóúÁÉÍÓÚ]+(?:[''][a-zA-Z0-9áéíóúÁÉÍÓÚ]+)*|[.,!?;:\-—""'„‟()[\]{}€£$])/g;
  const matches = text.match(tokenPattern);
  return matches ? matches.map(m => m.trim()).filter(m => m.length > 0) : [];
}

export function isPunctuation(char: string): boolean {
  const punctuationChars = [
    '.',
    ',',
    '!',
    '?',
    ';',
    ':',
    '-',
    '—',
    '"',
    "'",
    '„',
    '‟',
    '(',
    ')',
    '[',
    ']',
    '{',
    '}',
  ];
  return char.length === 1 && punctuationChars.includes(char);
}

export function compareChars(
  input: string,
  target: string,
): 'correct' | 'fadaMissing' | 'incorrect' {
  // Direct match
  if (input === target) {
    return 'correct';
  }

  // Case-insensitive match
  if (input.toLowerCase() === target.toLowerCase()) {
    return 'correct';
  }

  // Fada map
  const fadaMap: Record<string, string> = {
    á: 'a',
    Á: 'A',
    é: 'e',
    É: 'E',
    í: 'i',
    Í: 'I',
    ó: 'o',
    Ó: 'O',
    ú: 'u',
    Ú: 'U',
  };

  // Check if same base letter
  const inputBase = fadaMap[input] || input;
  const targetBase = fadaMap[target] || target;

  if (inputBase.toLowerCase() === targetBase.toLowerCase()) {
    return 'fadaMissing';
  }

  return 'incorrect';
}
