import * as Sentry from '@sentry/nextjs';

export async function GET() {
  const error = new Error('Server-side Sentry Test Error from Creldesk Studio!');
  Sentry.captureException(error);
  
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Test error has been manually dispatched to Sentry via Server API.' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
