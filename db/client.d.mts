export type QueryResult<T = Record<string, unknown>> = {
  rows: T[];
  rowCount: number;
};
export type Statement = { sql: string; values?: unknown[] };
export interface Database {
  query<T = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<T>>;
  transaction(statements: Statement[]): Promise<QueryResult[]>;
  close(): Promise<void>;
}
export function database(): Database;
