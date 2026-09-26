/** Uniform shape every value-list endpoint returns, so the frontend can render any of them with the same `<select>` logic. */
export interface ValueListItemResponse {
  value: string;
  label: string;
}
