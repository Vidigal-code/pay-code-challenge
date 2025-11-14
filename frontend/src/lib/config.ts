const rawApiBase = process.env.NEXT_PUBLIC_API_URL;
const normalizedApiBase = rawApiBase && rawApiBase !== 'undefined' && rawApiBase !== 'null' ? rawApiBase : undefined;
export const API_BASE = normalizedApiBase ?? 'http://localhost:4000';

const rawCookieName = process.env.NEXT_PUBLIC_COOKIE_NAME;
const normalizedCookieName = rawCookieName && rawCookieName !== 'undefined' && rawCookieName !== 'null' ? rawCookieName : undefined;
export const SESSION_COOKIE = normalizedCookieName ?? 'paycode_session';

const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL;
const normalizedWsUrl = rawWsUrl && rawWsUrl !== 'undefined' && rawWsUrl !== 'null' ? rawWsUrl : undefined;
export const WS_URL = normalizedWsUrl ?? 'ws://localhost:4000';
