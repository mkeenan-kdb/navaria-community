// Central export for all types

export * from './content';
export * from './database';
export * from './user';

// Letter slot status enum for lesson typing
export enum LetterSlotStatus {
  Empty = 'empty',
  Focused = 'focused',
  Correct = 'correct',
  Incorrect = 'incorrect',
  FadaMissing = 'fadaMissing',
  Disabled = 'disabled',
}
