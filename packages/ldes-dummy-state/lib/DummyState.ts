import type { URL } from 'url';
import type { IState } from '@ldes/types';

export class DummyState implements IState {
  private pages: URL[];

  public constructor() {
    this.pages = [];
  }

  public async getLatestPage(): Promise<URL | null> {
    if (this.pages.length > 0) {
      return this.pages[this.pages.length - 1];
    }

    return null;
  }

  public async setLatestPage(page: URL): Promise<void> {
    this.pages.push(page);
  }

  public async getProcessedPages(): Promise<URL[]> {
    return this.pages;
  }

  public async provision(): Promise<void> {
    // Nothing to provision here
  }

  public async reset(): Promise<void> {
    this.pages = [];
  }
}
