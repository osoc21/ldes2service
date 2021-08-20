import { URL } from 'url';
import type { IState, IStateConfig } from '@ldes/types';
import type { WrappedNodeRedisClient } from 'handy-redis';
import { createNodeRedisClient } from 'handy-redis';

export interface IRedisStateConfig extends IStateConfig {
  host?: string;
  port?: number;
  password?: string;
}

export class RedisState implements IState {
  private client: WrappedNodeRedisClient;
  private readonly settings: IRedisStateConfig;

  public constructor(settings: IRedisStateConfig) {
    this.settings = settings;
  }

  public async getLatestPage(): Promise<URL | null> {
    const pages = await this.getProcessedPages();

    return pages.length > 0 ? pages[pages.length - 1] : null;
  }

  public async setLatestPage(page: URL): Promise<void> {
    const pages = await this.getProcessedPages();

    if (!pages.some(el => el.href === page.href)) {
      pages.push(page);
      await this.setPages(pages);
    }
  }

  public async getProcessedPages(): Promise<URL[]> {
    return JSON.parse((await this.client.get(`ldes_${this.settings.id}_pages`)) ?? '[]').map(
      (url: string) => new URL(url)
    );
  }

  public async provision(): Promise<void> {
    this.client = createNodeRedisClient({
      host: this.settings.host ?? '127.0.0.1',
      port: this.settings.port ?? 6_379,
      password: this.settings.password ?? '',
    });
  }

  private async setPages(pages: URL[]): Promise<void> {
    await this.client.set(`ldes_${this.settings.id}_pages`, JSON.stringify(pages));
  }

  public async reset(): Promise<void> {
    await this.setPages([]);
  }
}
