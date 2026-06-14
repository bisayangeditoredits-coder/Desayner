export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://pixabay.com/',
      },
    });

    if (!res.ok) {
      console.error('[Pixabay Image Proxy Error]', res.status, res.statusText, url);
      return new Response('Failed to fetch image', { status: res.status });
    }

    const buffer = await res.arrayBuffer();
    
    return new Response(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[Pixabay Image Proxy Exception]', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
