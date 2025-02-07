import type { Url } from 'url';
import type { IState } from '@ldes/types';

export class DummyState implements IState {
  private readonly pages: Url[];

  public constructor() {
    this.pages = [];
  }

  public async getLatestPage(): Promise<Url | null> {
    if (this.pages.length > 0) {
      return this.pages[this.pages.length - 1];
    }

    return null;
  }

  public async setLatestPage(page: Url): Promise<void> {
    this.pages.push(page);
  }

  public async getProcessedPages(): Promise<Url[]> {
    return this.pages;
  }

  public async provision(): Promise<void> {
    // Nothing to provision here
  }
}
