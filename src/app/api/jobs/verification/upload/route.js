import { NextResponse } from 'next/server';
import { R2, BUCKET } from '@/lib/storage/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getServerAuth } from '@/lib/supabase/server';
import { safeLimit, createRateLimit } from '@/lib/rateLimit';
import { auditLogger } from '@/lib/security/auditLogger';
import { validateMagicNumber } from '@/lib/security/fileValidator';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// Rate limit: 3 uploads per hour to prevent abuse of the verification system
const verificationRateLimit = createRateLimit({ prefix: 'jobs:verification:upload', limiter: { type: 'fixedWindow', tokens: 3, window: '1h' } });

export async function POST(request) {
  let context = { ip: request.headers.get('x-forwarded-for') || 'unknown', route: '/api/jobs/verification/upload' };

  try {
    // 1. Strict Session Validation
    const { user } = await getServerAuth(request);
    if (!user) {
      auditLogger.warn('UNAUTHORIZED_VERIFICATION_UPLOAD', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    context.userId = user.id;

    // 2. Strict Rate Limiting (Fail-Secure)
    const { success } = await safeLimit(verificationRateLimit, user.id, { failOpen: false, logPrefix: 'VerificationUpload' });
    if (!success) {
      auditLogger.warn('RATE_LIMIT_EXCEEDED', context);
      return NextResponse.json({ error: 'Too many upload attempts. Please try again later.' }, { status: 429 });
    }

    // 3. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file');

    // 4. Validate File Exists and Size
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No valid document provided' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      auditLogger.warn('FILE_TOO_LARGE', { ...context, size: file.size });
      return NextResponse.json({ error: 'Document exceeds the 5MB limit' }, { status: 413 });
    }

    // 5. Validate MIME Type & Magic Numbers
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicNumber(buffer, ALLOWED_TYPES)) {
      auditLogger.warn('INVALID_FILE_MAGIC_NUMBER', { ...context, reportedType: file.type });
      return NextResponse.json({ error: 'Invalid document format. Only PDF, JPG, and PNG are allowed.' }, { status: 415 });
    }

    // Determine extension safely
    let ext = 'pdf';
    if (file.type === 'image/jpeg') ext = 'jpg';
    if (file.type === 'image/png') ext = 'png';

    // 6. Secure Upload to R2 (Private Prefix)
    const uid = uuidv4();
    const key = `verification-documents/${user.id}/${uid}.${ext}`;

    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    auditLogger.log('VERIFICATION_DOC_UPLOADED', { ...context, key });

    // We INTENTIONALLY do NOT return a publicUrl because this is a private document.
    return NextResponse.json({
      key,
    });
  } catch (error) {
    // 7. Zero-Error Tolerance
    auditLogger.error('VERIFICATION_UPLOAD_ERROR', error, context);
    return NextResponse.json({ error: 'An unexpected error occurred during document upload.' }, { status: 500 });
  }
}
