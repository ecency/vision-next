export interface CurationItem {
  efficiency: number;
  account: string;
  /** Curation reward for the period, in Hive Power. */
  hp: number;
  /**
   * @deprecated Alias of `hp`, kept while consumers migrate. The value has
   * always been Hive Power despite the name, which caused a double-conversion
   * bug downstream. Read `hp` instead.
   */
  vests: number;
  votes: number;
  uniques: number;
}

export type CurationDuration = "day" | "week" | "month";
