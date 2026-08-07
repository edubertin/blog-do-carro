export type D1Value = string | number | null | ArrayBuffer;
export type D1Row = Readonly<Record<string, D1Value>>;

export type D1Result<Row extends D1Row = D1Row> = Readonly<{
  success: boolean;
  results: readonly Row[];
  meta?: Readonly<Record<string, unknown>>;
}>;

export interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  first<Row extends D1Row = D1Row>(): Promise<Row | null>;
  all<Row extends D1Row = D1Row>(): Promise<D1Result<Row>>;
  run(): Promise<D1Result>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: readonly D1PreparedStatement[]): Promise<readonly D1Result[]>;
}
