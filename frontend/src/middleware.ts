import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import { SESSION_COOKIE } from './shared/config';

export function middleware(request: NextRequest) {
    const session = request.cookies.get(SESSION_COOKIE);
    const isAuth = Boolean(session?.value);
    const {pathname} = request.nextUrl;

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
    const isHomePage = pathname === '/';
    const isApi = pathname.startsWith('/api');
    const isPublic = isAuthPage || isHomePage || isApi;

    if (isAuth && isAuthPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    if (!isAuth && !isPublic) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
