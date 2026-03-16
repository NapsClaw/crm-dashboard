import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, getAuthCookieValue } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  
  if (verifyPassword(password)) {
    const cookie = getAuthCookieValue();
    const response = NextResponse.json({ success: true });
    response.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      maxAge: cookie.maxAge,
    });
    return response;
  }
  
  return NextResponse.json({ success: false, error: 'Senha incorreta' }, { status: 401 });
}
