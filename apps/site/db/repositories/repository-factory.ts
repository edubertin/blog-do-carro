import { PersistenceDisabledError } from "../contracts";
import type { DataRepositories, FoundationRepositorySeed } from "../contracts";
import type { D1Database } from "../d1";
import { createD1Repositories } from "./d1-repositories";
import { createMemoryRepositories } from "./memory-repositories";

export type PersistenceMode = "disabled" | "d1-preview";

export type RepositoryFactoryOptions = Readonly<{
  mode: PersistenceMode;
  database?: D1Database;
  fixtureSeed: FoundationRepositorySeed;
}>;

export function createDataRepositories(options: RepositoryFactoryOptions): DataRepositories {
  if (options.mode === "disabled") return createMemoryRepositories(options.fixtureSeed);
  if (!options.database) throw new PersistenceDisabledError();
  return createD1Repositories(options.database);
}
