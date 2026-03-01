export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const originalHostname = url.hostname;
    const supabaseHostname = 'gpkqfjlgmdbvztlwtawy.supabase.co';
    
    url.hostname = supabaseHostname;

    // Create new headers, copying all original client headers
    const newHeaders = new Headers(request.headers);
    
    // CRITICAL FIX FOR GOTRUE TOKEN EXCHANGE:
    // GoTrue computes the `redirect_uri` identically in both the authorize phase
    // and the callback phase. If it lacks a port or assumes a different scheme,
    // the two URLs might differ slightly (e.g., one has :443, one doesn't), which
    // causes Google's strict token endpoint to reject the `redirect_uri`.
    // We MUST supply the full matrix of X-Forwarded headers perfectly.
    newHeaders.set('Host', supabaseHostname);
    newHeaders.set('X-Forwarded-Host', originalHostname);
    newHeaders.set('X-Forwarded-Proto', 'https');
    newHeaders.set('X-Forwarded-Port', '443');
    
    const clientIP = request.headers.get('CF-Connecting-IP');
    if (clientIP) {
      newHeaders.set('X-Forwarded-For', clientIP);
    }

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
    // We rewrite it to WHICHEVER origin they initiated the request from (localhost or proxy).
    const locationHeader = newResponse.headers.get('Location');
    if (locationHeader && locationHeader.includes(supabaseHostname)) {
        
        let targetHost = originalHostname;
        if (origin.includes('localhost:3000')) {
            targetHost = 'localhost:3000';
            // Also need to rewrite https to http for localhost
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
  },
};
