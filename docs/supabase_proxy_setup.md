Here is the code and a step-by-step guide to setting up a free Cloudflare Worker to proxy all your Supabase traffic. This will give you a new, unblocked URL to use in your

.env
file instead of the blocked .supabase.co URL.

Step 1: Create the Worker
Log in or sign up for a free account at Cloudflare Dashboard.
On the left sidebar, click Workers & Pages.
Click the Create application button, then click Create Worker.
Name your worker something like openx-supabase-proxy, then click Deploy (don't worry about the starter code, we will change it).
Step 2: Add the Proxy Code
Once deployed, click Edit code.
Delete all the existing code in worker.js and paste the following code:
javascript
// worker.js
export default {
async fetch(request, env, ctx) {
const url = new URL(request.url);

    // Replace this with your specific Supabase project URL
    // We extracted this from your connection string
    url.hostname = 'gpkqfjlgmdbvztlwtawy.supabase.co';
    // Create a new request object with the updated URL
    const modifiedRequest = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    });
    // Forward the original client IP to Supabase for security logging
    const clientIP = request.headers.get('CF-Connecting-IP');
    if (clientIP) {
      modifiedRequest.headers.set('X-Forwarded-For', clientIP);
    }
    // Fetch the response from Supabase and return it to the app
    const response = await fetch(modifiedRequest);

    // Some CORS headers might be needed depending on your exact setup,
    // but Cloudflare usually passes Supabase's pristine CORS headers back safely.
    return response;

},
};
Click Save and deploy in the top right corner.
Step 3: Update your

.env
File
Once deployed, Cloudflare will give you a worker URL that looks something like https://openx-supabase-proxy.your-username.workers.dev.

Go to your

w:\chat.env
file and change the NEXT_PUBLIC_SUPABASE_URL:

env

# Before

# NEXT_PUBLIC_SUPABASE_URL=https://gpkqfjlgmdbvztlwtawy.supabase.co

# After (Replace with your actual Cloudflare Worker URL)

NEXT_PUBLIC_SUPABASE_URL=https://openx-supabase-proxy.your-username.workers.dev
Since the proxy simply forwards all paths perfectly, your Auth, Realtime, and Database REST requests will now route securely through Cloudflare, completely bypassing the ISP block! Restart your Next.js server (npm run dev) and it should work instantly.
