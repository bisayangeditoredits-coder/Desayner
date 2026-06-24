import { NextResponse } from 'next/server';
import { R2, BUCKET, getAssetUrl } from '@/lib/storage/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getServerAuth } from '@/lib/supabase/server';
import { z } from 'zod';
import { safeLimit, createRateLimit } from '@/lib/rateLimit';
import { auditLogger } from '@/lib/security/auditLogger';
import { validateMagicNumber } from '@/lib/security/fileValidator';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf'];

// Rate limit: 5 uploads per 10 minutes to prevent spam
const uploadRateLimit = createRateLimit({ prefix: 'jobs:apply:upload', limiter: { type: 'fixedWindow', tokens: 5, window: '10m' } });

// Schema for form fields
const ApplyUploadSchema = z.object({
  jobId: z.string().uuid().optional().or(z.literal('direct')),
});

export async function POST(request) {
  let context = { ip: request.headers.get('x-forwarded-for') || 'unknown', route: '/api/jobs/apply/upload' };

  try {
    // 1. Strict Session Validation
    const { user } = await getServerAuth(request);
    if (!user) {
      auditLogger.warn('UNAUTHORIZED_UPLOAD_ATTEMPT', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    context.userId = user.id;

    // 2. Strict Rate Limiting (Fail-Secure)
    const { success } = await safeLimit(uploadRateLimit, user.id, { failOpen: false, logPrefix: 'ApplyUpload' });
    if (!success) {
      auditLogger.warn('RATE_LIMIT_EXCEEDED', context);
      return NextResponse.json({ error: 'Too many upload attempts' }, { status: 429 });
    }

    // 3. Parse FormData
    const formData = await request.formData();
    const file = formData.get('file');
    const rawJobId = formData.get('jobId') || 'direct';

    // 4. Validate Input Data
    const parsedData = ApplyUploadSchema.safeParse({ jobId: rawJobId });
    if (!parsedData.success) {
      auditLogger.warn('INVALID_UPLOAD_PARAMS', { ...context, issues: parsedData.error.issues });
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // 5. Validate File Exists and Size (Fail-Secure)
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      auditLogger.warn('FILE_TOO_LARGE', { ...context, size: file.size });
      return NextResponse.json({ error: 'File exceeds the 10MB limit' }, { status: 413 });
    }

    // 6. Validate MIME Type & Magic Numbers
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (!validateMagicNumber(buffer, ALLOWED_TYPES)) {
      auditLogger.warn('INVALID_FILE_MAGIC_NUMBER', { ...context, reportedType: file.type });
      return NextResponse.json({ error: 'Invalid file format. Only true PDF files are allowed.' }, { status: 415 });
    }

    // 7. Secure Upload to R2
    const uid = uuidv4();
    const jobId = parsedData.data.jobId;
    const key = `resumes/${jobId}/${uid}.pdf`;

    await R2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      })
    );

    const fileUrl = getAssetUrl(key);

    auditLogger.log('RESUME_UPLOADED_SUCCESSFULLY', { ...context, key });

    return NextResponse.json({
      fileUrl,
      key,
    });
  } catch (error) {
    // 8. Zero-Error Tolerance
    auditLogger.error('RESUME_UPLOAD_ERROR', error, context);
    return NextResponse.json({ error: 'An unexpected error occurred during upload.' }, { status: 500 });
  }
}
