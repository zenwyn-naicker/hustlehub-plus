export async function api(path, { token, method = 'GET', body } = {}) {
  let response;

  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new Error('Cannot reach the server. Please try again.');
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(json?.message || 'Request failed. Please try again.');
    error.status = response.status;
    error.fields = (json?.errors || [])
      .map(item => item.message === 'Password must not exceed 72 UTF-8 bytes.'
        ? 'Your password is too long. Please choose a shorter password.'
        : `${item.field === 'priceCents' ? 'Price' : item.field}: ${item.message}`)
      .join(' ');
    throw error;
  }

  if (!json) {
    throw new Error('Server returned an unreadable response.');
  }

  return json.data;
}
