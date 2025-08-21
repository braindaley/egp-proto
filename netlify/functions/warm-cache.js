// Netlify Function to warm the bills cache
// This can be triggered by Netlify's scheduled functions feature

exports.handler = async (event, context) => {
  // Get the deployment URL from environment
  const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://your-site.netlify.app';
  
  // Optional: Check for a secret to prevent unauthorized calls
  const secret = process.env.CACHE_REVALIDATION_SECRET;
  
  try {
    console.log('[Warm Cache] Starting cache warming...');
    
    // Call the prefetch endpoint
    const prefetchUrl = `${siteUrl}/api/bills/prefetch${secret ? `?secret=${secret}` : ''}`;
    const response = await fetch(prefetchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Prefetch failed with status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('[Warm Cache] Cache warming complete:', result);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Cache warmed successfully',
        result
      }),
    };
  } catch (error) {
    console.error('[Warm Cache] Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to warm cache',
        details: error.message
      }),
    };
  }
};