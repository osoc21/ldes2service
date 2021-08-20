import type { URL } from 'url';

export interface IStateConfig {
  id: string;
}

export interface IState {
  /**
   * Create tables for projection status, init counters, enable necessary plugins
   */
  provision: () => Promise<void>;

  /**
   * Mark this page as the latest one that was processed
   */
  setLatestPage: (page: URL) => Promise<void>;

  /**
   * Return the latest processed page
   */
  getLatestPage: () => Promise<URL | null>;

  /**
   * Return all processed pages
   */
  getProcessedPages: () => Promise<URL[]>;

  /**
   * Resets the state, effectively deleting all the pages
   */
  reset: () => Promise<void>;
}
