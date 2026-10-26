/*Code Attribution: */
/**************************************************************************************************************
 * Author: Vitest Contributors
 * Date: 2026
 * Title: Vitest
 * Type: [Source Code]
 * Available at: <https://github.com/vitest-dev/vitest> [Accessed 15 September 2026]
 **************************************************************************************************************/

import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api.js';

afterEach(() => vi.unstubAllGlobals());

function respond(body, status = 200) {
  const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('API requests and safe failures', () => {
  it('sends authenticated JSON and unwraps response data', async () => {
    const fetch = respond({ data: { gig: { title: 'Logo design' } } });
    const body = { title: 'Logo design', description: 'Custom logo', priceCents: 12550 };
    await expect(api('/gigs', { token: 'test-token', method: 'POST', body }))
      .resolves.toEqual({ gig: { title: 'Logo design' } });
    expect(fetch).toHaveBeenCalledWith('/api/gigs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-token' },
      body: JSON.stringify(body)
    });
  });

  it('omits authentication and JSON headers for an anonymous GET', async () => {
    const fetch = respond({ data: {} });
    await api('/health');
    expect(fetch).toHaveBeenCalledWith('/api/health', { method: 'GET', headers: {} });
  });

  it('preserves validation details and HTTP status', async () => {
    respond({ message: 'Validation failed.', errors: [{ field: 'title', message: 'Too short.' }] }, 400);
    await expect(api('/gigs')).rejects.toMatchObject({
      message: 'Validation failed.', status: 400, fields: 'title: Too short.'
    });
  });

  it('preserves a non-JSON 401 for session expiry handling', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', { status: 401 })));
    await expect(api('/gigs')).rejects.toMatchObject({
      message: 'Request failed. Please try again.', status: 401
    });
  });

  it('reports network failures without exposing internal errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Internal connection detail')));
    await expect(api('/gigs')).rejects.toThrow('Cannot reach the server. Please try again.');
  });

  it('rejects unreadable successful responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Unavailable</html>')));
    await expect(api('/gigs')).rejects.toThrow('Server returned an unreadable response.');
  });

  it('accepts successful deletion responses without a data field', async () => {
    respond({ success: true, message: 'Gig removed from listings.' });
    await expect(api('/gigs/test-id', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});
