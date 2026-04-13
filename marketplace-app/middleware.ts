import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth';

function isApiPath(pathname: string) {
  return pathname.startsWith('/api/');
}

export default auth((req: NextRequest) => {
  const pathname = req.nextUrl.pathname;
  const session = (req as NextRequest & { auth: Session | null }).auth;

  const requiresCreator = pathname.startsWith('/dashboard/creator');
  const requiresAdmin = pathname.startsWith('/dashboard/admin') || pathname.startsWith('/api/admin/');

  if (!requiresCreator && !requiresAdmin) return NextResponse.next();

  if (!session?.user) {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  const role = session.user.role;
  if (requiresAdmin && role !== 'ADMIN') {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/marketplace', req.url));
  }

  if (requiresCreator && role !== 'CREATOR') {
    if (isApiPath(pathname)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.redirect(new URL('/marketplace', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/api/admin/:path*'],
};
