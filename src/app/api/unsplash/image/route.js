export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  if (!/^https:\/\/images\.unsplash\.com\//i.test(url)) {
    return new Response('Invalid image URL', { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Desayner/1.0)',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        Referer: 'https://unsplash.com/',
      },
    });

    if (!res.ok) {
      console.error('[Unsplash Image Proxy Error]', res.status, res.statusText, url);
      return new Response('Failed to fetch image', { status: res.status });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[Unsplash Image Proxy Exception]', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
