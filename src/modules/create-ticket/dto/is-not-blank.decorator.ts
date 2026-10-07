import { Matches, ValidationOptions } from 'class-validator';

const NOT_BLANK_PATTERN = /\S/;

/**
 * Rejects strings that are empty or made only of whitespace. It mirrors the
 * rule enforced by the ticket entity builders, so blank input is answered with
 * a 400 by the ValidationPipe instead of a plain Error (500) at build time.
 */
export function IsNotBlank(validationOptions?: ValidationOptions) {
  return Matches(NOT_BLANK_PATTERN, {
    message: '$property must not be blank',
    ...validationOptions,
  });
}
