export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originalHostname = url.hostname;
    const supabaseHostname = 'gpkqfjlgmdbvztlwtawy.supabase.co';
    
    url.hostname = supabaseHostname;

    // Create new headers, copying all original client headers explicitly
    const newHeaders = new Headers(request.headers);
    
    // CRITICAL FIX: The proxy MUST act as the universal `X-Forwarded-Host`.
    // We supply the full matrix of X-Forwarded headers perfectly so GoTrue 
    // constructs identical URLs across the Authorize and Token Exchange phases.
    newHeaders.set('Host', supabaseHostname);
    newHeaders.set('X-Forwarded-Host', originalHostname);
    newHeaders.set('X-Forwarded-Proto', 'https');
    newHeaders.set('X-Forwarded-Port', '443');
    
    const clientIP = request.headers.get('CF-Connecting-IP');
    if (clientIP) {
      newHeaders.set('X-Forwarded-For', clientIP);
    }

    // Explicitly rebuild the request to ensure the POST body (for token exchange)
    // is safely passed to GoTrue without stream exhaustion bugs.
    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.body,
      redirect: 'manual' 
    });

    const response = await fetch(modifiedRequest);
    const newResponse = new Response(response.body, response);

    // CRITICAL FIX FOR OAUTH OVER PROXY: 
    // Any time a response (like Google's redirect or a magic link) tries to send the user 
    // specifically to the blocked `supabase.co` domain, we MUST rewrite it!
    const locationHeader = newResponse.headers.get('Location');
    if (locationHeader && locationHeader.includes(supabaseHostname)) {
        
        // We rewrite it to WHICHEVER origin they initiated the request from (localhost or proxy).
        const origin = request.headers.get('Origin') || request.headers.get('Referer') || '';
        let targetHost = originalHostname;
        
        if (origin.includes('localhost:3000')) {
            targetHost = 'localhost:3000';
            const rewrittenLocation = locationHeader
                .replace(supabaseHostname, targetHost)
                .replace('https://localhost', 'http://localhost');
            newResponse.headers.set('Location', rewrittenLocation);
        } else {
            const rewrittenLocation = locationHeader.replace(
                supabaseHostname, 
                targetHost
            );
            newResponse.headers.set('Location', rewrittenLocation);
        }
    }

    return newResponse;
  }
};
