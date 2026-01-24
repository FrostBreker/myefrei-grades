import {NextRequest, NextResponse} from 'next/server';

export function middleware(request: NextRequest) {
    const origin: string | null = request.headers.get('origin');
    const host: string | null = request.headers.get('host');

    if (!host) {
        return NextResponse.json({ error: 'Host is required, server error' }, { status: 400 });
    }

    if (request.method === 'POST' && request.nextUrl.pathname.startsWith('/api/')) {
        // We verify the origin to make sure the request come from our own front-end
        if (origin && !origin.includes(host)) {
            return NextResponse.json({ error: 'Origin not authorized' }, { status: 403 });
        }

        // We verify the content-type to make sure we only accept JSON
        const contentType = request.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return NextResponse.json({ error: 'Content-Type invalid' }, { status: 400 });
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/api/:path*',
};