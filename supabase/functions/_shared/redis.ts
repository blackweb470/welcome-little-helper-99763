// Upstash Redis HTTP Client for Supabase Edge Functions with Fallback to Postgres

export class UpstashRedis {
  private url: string | null;
  private token: string | null;

  constructor() {
    this.url = Deno.env.get('UPSTASH_REDIS_REST_URL') || null;
    this.token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || null;
  }

  public isConfigured(): boolean {
    return Boolean(this.url && this.token);
  }

  public async incr(key: string): Promise<number | null> {
    if (!this.isConfigured()) return null;
    try {
      const res = await fetch(`${this.url}/incr/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return typeof data.result === 'number' ? data.result : null;
    } catch (err) {
      console.error('Upstash Redis INCR error:', err);
      return null;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConfigured()) return false;
    try {
      const res = await fetch(`${this.url}/expire/${encodeURIComponent(key)}/${seconds}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data.result === 1;
    } catch (err) {
      console.error('Upstash Redis EXPIRE error:', err);
      return false;
    }
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isConfigured()) return null;
    try {
      const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return typeof data.result === 'string' ? data.result : null;
    } catch (err) {
      console.error('Upstash Redis GET error:', err);
      return null;
    }
  }
}

export const redis = new UpstashRedis();
