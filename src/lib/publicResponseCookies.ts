export const RESPONSE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export function getResponseCookieName(token: string) {
  return `wb_response_${token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80)}`;
}
