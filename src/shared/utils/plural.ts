/** « 1 cours », « 18 cours », « 1 document », « 24 documents » : accord simple en nombre. */
export function countLabel(count: number, singular: string, plural: string = `${singular}s`): string {
  return `${count} ${count > 1 ? plural : singular}`;
}
