import { NextResponse } from 'next/server';

const JOBICY_API_URL = 'https://jobicy.com/api/v2/remote-jobs?count=100';
const REMOTE_OK_API_URL = 'https://remoteok.com/api';
const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';
const HIMALAYAS_API_URL = 'https://himalayas.app/jobs/api';

const CACHE_HEADERS = {
  'Cache-Control': 's-maxage=21600, stale-while-revalidate=43200',
};

const BLOCKED_PHRASES = [
  '100% commission', 'commission only', 'uncapped earning potential',
  'high-ticket', 'no experience required', 'get rich', 'crypto trading',
  'forex', 'casino', 'adult', 'whatsapp', 'telegram only',
  'pay to apply', 'registration fee', 'training fee', 'investment required',
];

const SOURCE_LINKS = [
  { name: 'Himalayas', url: 'https://himalayas.app/' },
  { name: 'Remotive', url: 'https://remotive.com/' },
  { name: 'Jobicy', url: 'https://jobicy.com/jobs-rss-feed' },
  { name: 'Remote OK', url: 'https://remoteok.com/api' },
];

const CATEGORY_RULES = [
  ['Design', /design|graphic|visual|creative|art director|brand|motion|ui\/ux|ux|figma|illustration|content creator/i],
  ['Development', /developer|engineer|software|frontend|backend|full[- ]?stack|devops|sdet|typescript|javascript|python|java|golang|cloud|wordpress|shopify/i],
  ['Marketing', /marketing|seo|social media|growth|content|copy|ads|campaign|community manager/i],
  ['Product', /product|project manager|scrum|agile|owner|program manager/i],
  ['Data', /data|analytics|analyst|bi |business intelligence|machine learning|ai|artificial intelligence/i],
  ['Customer Support', /support|success|customer|helpdesk|service|technical support/i],
  ['Sales', /sales|account executive|partnership|business development|revenue/i],
  ['Finance', /finance|accounting|payroll|bookkeep|accounts receivable|auditor|tax/i],
  ['Legal', /legal|compliance|privacy|counsel|regulatory/i],
  ['Writing', /writing|writer|editor|translator|localization|proofread/i],
  ['Operations', /operations|admin|assistant|hr|recruit|people|office|coordinator/i],
];

function cleanText(value = '') {
  return String(value)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00c2/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function trimDescription(value, length = 260) {
  const cleaned = cleanText(value)
    .replace(/Please mention the word[\s\S]*$/i, '')
    .trim();
  return cleaned.length > length ? `${cleaned.slice(0, length).trim()}...` : cleaned;
}

function firstValue(value, fallback = '') {
  if (Array.isArray(value)) return value.filter(Boolean)[0] || fallback;
  return value || fallback;
}

function formatSalaryRange(min, max, currency = 'USD') {
  const minimum = Number(min || 0);
  const maximum = Number(max || 0);
  if (!minimum && !maximum) return '';

  const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
  if (minimum && maximum) return `${currency} ${formatter.format(minimum)}-${formatter.format(maximum)}`;
  if (minimum) return `From ${currency} ${formatter.format(minimum)}`;
  return `Up to ${currency} ${formatter.format(maximum)}`;
}

function getFallbackLogo(companyName) {
  if (!companyName || companyName === 'Unknown company') return '';
  const domain = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`;
}

function deriveCategory(...values) {
  const text = values.flat().filter(Boolean).join(' ');
  const match = CATEGORY_RULES.find(([, pattern]) => pattern.test(text));
  return match ? match[0] : 'Business';
}

function normalizeHimalayasJob(job) {
  const rawTags = Array.isArray(job.categories) ? job.categories.map(cleanText) : [];
  const category = deriveCategory(job.categories, job.title, job.description);
  return {
    id: `himalayas-${job.guid || Math.random().toString(36)}`,
    title: cleanText(job.title || 'Untitled role'),
    company: cleanText(job.companyName || 'Unknown company'),
    logo: job.companyLogo || getFallbackLogo(job.companyName),
    category,
    location: cleanText(job.locationRestrictions?.join(', ') || 'Worldwide'),
    salary: formatSalaryRange(job.minSalary, job.maxSalary, job.currency || 'USD'),
    jobType: cleanText(job.employmentType || 'Remote'),
    level: cleanText(Array.isArray(job.seniority) ? job.seniority.join(', ') : ''),
    publishedAt: job.pubDate ? new Date(job.pubDate * 1000).toISOString() : '',
    url: job.applicationLink || job.guid,
    source: 'Himalayas',
    sourceUrl: 'https://himalayas.app/',
    tags: rawTags.slice(0, 6),
    description: trimDescription(job.excerpt || job.description || ''),
  };
}

function normalizeRemotiveJob(job) {
  const rawTags = Array.isArray(job.tags) ? job.tags : [];
  const tags = rawTags.map(cleanText).filter(Boolean);
  return {
    id: `remotive-${job.id}`,
    title: cleanText(job.title || 'Untitled role'),
    company: cleanText(job.company_name || 'Unknown company'),
    logo: job.company_logo || getFallbackLogo(job.company_name),
    category: deriveCategory(job.category, job.title, tags),
    location: cleanText(job.candidate_required_location || 'Worldwide'),
    salary: cleanText(job.salary || ''),
    jobType: job.job_type === 'full_time' ? 'Full-Time' : job.job_type === 'contract' ? 'Contract' : 'Remote',
    level: tags.find((tag) => /senior|lead|manager|principal/i.test(tag)) ? 'Senior' : '',
    publishedAt: job.publication_date || '',
    url: job.url,
    source: 'Remotive',
    sourceUrl: 'https://remotive.com/',
    tags: tags.slice(0, 6),
    description: trimDescription(job.description || ''),
  };
}

function normalizeJobicyJob(job) {
  const rawIndustry = Array.isArray(job.jobIndustry) ? job.jobIndustry.map(cleanText) : [cleanText(job.jobIndustry || '')];
  const category = deriveCategory(job.jobTitle, job.companyName, rawIndustry, job.jobExcerpt);
  return {
    id: `jobicy-${job.id}`,
    title: cleanText(job.jobTitle || 'Untitled role'),
    company: cleanText(job.companyName || 'Unknown company'),
    logo: job.companyLogo || getFallbackLogo(job.companyName),
    category,
    location: cleanText(job.jobGeo || 'Anywhere'),
    salary: formatSalaryRange(job.salaryMin, job.salaryMax, job.salaryCurrency || 'USD'),
    jobType: cleanText(firstValue(job.jobType, 'Remote')),
    level: cleanText(job.jobLevel || ''),
    publishedAt: job.pubDate || '',
    url: job.url,
    source: 'Jobicy',
    sourceUrl: 'https://jobicy.com/jobs-rss-feed',
    tags: rawIndustry.filter(Boolean).slice(0, 6),
    description: trimDescription(job.jobExcerpt || job.jobDescription || ''),
  };
}

function normalizeRemoteOkJob(job) {
  const tags = Array.isArray(job.tags) ? job.tags.map(cleanText).filter(Boolean) : [];
  const category = deriveCategory(job.position, job.company, tags, job.description);
  return {
    id: `remoteok-${job.id}`,
    title: cleanText(job.position || 'Untitled role'),
    company: cleanText(job.company || 'Unknown company'),
    logo: job.company_logo || job.logo || getFallbackLogo(job.company),
    category,
    location: cleanText(job.location || 'Remote'),
    salary: formatSalaryRange(job.salary_min, job.salary_max),
    jobType: tags.includes('full time') ? 'Full-Time' : 'Remote',
    level: tags.find((tag) => /senior|lead|manager|principal|junior/i.test(tag)) || '',
    publishedAt: job.date || (job.epoch ? new Date(job.epoch * 1000).toISOString() : ''),
    url: job.apply_url || job.url,
    source: 'Remote OK',
    sourceUrl: 'https://remoteok.com/api',
    tags: tags.slice(0, 6),
    description: trimDescription(job.description || ''),
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'CreldeskStudioJobBoard/1.0' },
    next: { revalidate: 21600 },
  });
  if (!response.ok) return null;
  return response.json();
}

async function loadJobicyJobs() {
  const data = await fetchJson(JOBICY_API_URL);
  return (data?.jobs || []).map(normalizeJobicyJob);
}

async function loadRemoteOkJobs() {
  const data = await fetchJson(REMOTE_OK_API_URL);
  return Array.isArray(data) ? data.filter((item) => item?.id).map(normalizeRemoteOkJob) : [];
}

async function loadRemotiveJobs() {
  const data = await fetchJson(REMOTIVE_API_URL);
  return (data?.jobs || []).map(normalizeRemotiveJob);
}

async function loadHimalayasJobs() {
  // Fetch up to 1000 jobs from Himalayas (10 pages of 100)
  const offsets = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  const pages = await Promise.allSettled(
    offsets.map((offset) => fetchJson(`${HIMALAYAS_API_URL}?limit=100&offset=${offset}`))
  );
  return pages.flatMap((result) => {
    if (result.status !== 'fulfilled') return [];
    return (result.value?.jobs || []).map(normalizeHimalayasJob);
  });
}

function isLikelyQualityJob(job) {
  const title = job.title.toLowerCase();
  const company = job.company.toLowerCase();
  const description = job.description.toLowerCase();
  const combined = `${title} ${company} ${description}`;

  if (!job.url || !job.company || job.company === 'Unknown company') return false;
  if (title.length < 4 || company.length < 2) return false;
  if (BLOCKED_PHRASES.some((phrase) => combined.includes(phrase))) return false;
  
  return true;
}

function jobKey(job) {
  return `${job.company.toLowerCase()}::${job.title.toLowerCase()}`.replace(/[^a-z0-9:]+/g, '');
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = jobKey(job);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function matchesSearch(job, query) {
  if (!query) return true;
  const haystack = [job.title, job.company, job.category, job.location, job.description, ...(job.tags || [])].join(' ').toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function matchesCategory(job, category) {
  return !category || category === 'All' || job.category.toLowerCase() === category.toLowerCase();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('q') || '').trim();
    const category = (searchParams.get('category') || '').trim();

    const settled = await Promise.allSettled([
      loadHimalayasJobs(),
      loadRemotiveJobs(),
      loadJobicyJobs(),
      loadRemoteOkJobs(),
    ]);

    const allJobs = settled.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
    
    // Some APIs return duplicates or very long list. Dedupe and filter for quality.
    const jobs = dedupeJobs(allJobs).filter(isLikelyQualityJob);
    
    // Filter by search/category
    const filteredJobs = jobs.filter((job) => matchesCategory(job, category) && matchesSearch(job, query));
    
    // Sort by newest first
    filteredJobs.sort((a, b) => {
      const da = new Date(a.publishedAt).getTime() || 0;
      const db = new Date(b.publishedAt).getTime() || 0;
      return db - da;
    });

    const categories = Array.from(new Set(jobs.map((job) => job.category).filter(Boolean))).sort();

    return NextResponse.json(
      {
        jobs: filteredJobs,
        categories,
        count: filteredJobs.length,
        total: jobs.length,
        source: 'Verified Sources (Himalayas, Remotive, Jobicy, RemoteOK)',
        sourceUrl: '',
        sourceLinks: SOURCE_LINKS,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (error) {
    console.error('[Jobs API Error]', error);
    return NextResponse.json(
      { error: 'Failed to load remote jobs.', jobs: [], categories: [] },
      { status: 500 }
    );
  }
}
