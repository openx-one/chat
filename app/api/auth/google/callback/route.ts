/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/auth-code-error`);
  }

  const clientId = process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
      console.error("Missing Google OAuth Credentials in .env");
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/auth-code-error`);
  }
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  try {
    // 1. Exchange the Google Code for Google Tokens manually
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Failed to exchange token');

    // 2. Fetch User Profile from Google using the Access Token
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const userData = await userResponse.json();
    const email = userData.email;

    if (!email) throw new Error('No email found from Google');

    // 3. Initialize Supabase Admin Client to securely generate session using Service Role Key
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Requires Admin privileges
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
        },
      }
    );

    // 4. Upsert User in Supabase Auth (Creates user if missing, ignores if exists)
    // admin.createUser fails if the user already exists. We check if they do.
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let user = existingUsers.users.find((u) => u.email === email);

    if (!user) {
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
                avatar_url: userData.picture,
                full_name: userData.name,
            }
        });
        if (createError) throw createError;
        user = newUser.user;
    }

    if (!user) throw new Error("Failed to resolve user account.");

    // 5. Force a Session Generation
    // Since Supabase doesn't have a pristine administrative "Create Session for User" API, 
    // we use the established workaround: Admin generates a Magic Link, then we silently exchange it.
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
    });
    
    if (linkError) throw linkError;

    // Extract the token (or token_hash for PKCE) from the action_link
    const actionUrl = new URL(linkData.properties.action_link);
    const token = actionUrl.searchParams.get('token');
    const tokenHash = actionUrl.searchParams.get('token_hash');
    
    if (!token && !tokenHash) throw new Error("Failed to extract session token from link: " + linkData.properties.action_link);

    const { error: sessionError } = await supabase.auth.verifyOtp({
        token_hash: tokenHash || token || '',
        type: 'magiclink',
    });

    if (sessionError) throw sessionError;

    // Redirection Back to App (Supabase cookies have now been set by verifyOtp)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/`);

  } catch (err: any) {
    console.error('Google Auth Error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/auth/auth-code-error`);
  }
}
