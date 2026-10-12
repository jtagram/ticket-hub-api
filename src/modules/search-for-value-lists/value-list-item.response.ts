import { ApiProperty } from '@nestjs/swagger';

/** Uniform shape every value-list endpoint returns, so the frontend can render any of them with the same `<select>` logic. */
export class ValueListItemResponse {
  @ApiProperty({
    description: 'Value submitted by the form when the item is selected.',
    example: 'john.approver@example.com',
  })
  value!: string;

  @ApiProperty({
    description: 'Text shown to the user for the item.',
    example: 'John Approver (john.approver@example.com)',
  })
  label!: string;
}
