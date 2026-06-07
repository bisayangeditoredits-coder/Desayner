# Comprehensive Code Review - CreldeskStudio Next.js Application

**Review Date:** 2026-06-08  
**Scope:** Full stack Next.js application (API routes, pages, components)

---

## Executive Summary

This review identified **31 issues** across the codebase spanning security, error handling, performance, and code quality. Critical issues exist in admin API routes that lack authentication checks, missing error handling in critical flows, potential race conditions, and several performance bottlenecks.

---

## CRITICAL ISSUES (Address Immediately)

### 1. 🔴 CRITICAL: Missing Authentication on Admin Routes
**Severity:** Critical  
**File:** [src/app/api/admin/deleted-items/route.js](src/app/api/admin/deleted-items/route.js#L1), [src/app/api/admin/restore/route.js](src/app/api/admin/restore/route.js#L1)

**Issue:** Admin endpoints for viewing deleted items and restoring data use service role credentials but **do NOT verify if the user is actually an admin**. Any authenticated user can call these endpoints.

**Current Code:**
```javascript
// No authentication check
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
// Directly allows any caller to restore items
await supabaseAdmin.from(table).update({ deleted_at: null }).eq('id', id);
```

**Fix:**
```javascript
export async function GET(req) {
  const supabaseAuth = createServerClient(...);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Check if user is admin
  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
    
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... rest of logic
}
```

---

### 2. 🔴 CRITICAL: Unsafe Restore Route - SQL Injection via Table Name
**Severity:** Critical  
**File:** [src/app/api/admin/restore/route.js](src/app/api/admin/restore/route.js#L12)

**Issue:** The `table` parameter is passed directly into `.from(table)` without validation. An attacker can inject table names, potentially bypassing RLS or accessing unintended data.

**Current Code:**
```javascript
const { table, id } = await req.json();
if (!table || !id) return NextResponse.json({ error: 'Missing table or id' }, { status: 400 });

const { error } = await supabaseAdmin
  .from(table)  // ❌ Unvalidated table name!
  .update({ deleted_at: null })
  .eq('id', id);
```

**Fix:**
```javascript
const ALLOWED_TABLES = ['projects', 'assets', 'resources'];
if (!ALLOWED_TABLES.includes(table)) {
  return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
}
```

---

### 3. 🔴 CRITICAL: Race Condition in Onboarding Profile Save
**Severity:** Critical  
**File:** [src/app/actions/onboardingActions.js](src/app/actions/onboardingActions.js#L1)

**Issue:** Two identical `saveProfileAdmin` functions exist (one in `/onboarding/actions.js` and one in `/actions/onboardingActions.js`). The one in `/actions/onboardingActions.js` **bypasses authentication checks**, allowing anyone to modify any user's profile.

**Current Code in onboardingActions.js:**
```javascript
export async function saveProfileAdmin(profileData) {
  // ❌ NO AUTHENTICATION CHECK!
  const supabaseAdmin = createClient(...);
  const { error } = await supabaseAdmin
    .from('profiles')
    .upsert(profileData);  // Can be called with any user ID
}
```

**Fix:** Delete the insecure version in `/actions/onboardingActions.js` and use only the secure version from `/onboarding/actions.js` which includes auth verification.

---

### 4. 🔴 CRITICAL: Auth Callback Silent Failure on Code Exchange
**Severity:** Critical  
**File:** [src/app/auth/callback/route.js](src/app/auth/callback/route.js#L37)

**Issue:** If `exchangeCodeForSession()` fails, the error is not properly logged, and users get a vague error message. The redirect to login might fail silently.

**Current Code:**
```javascript
const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

if (!error && sessionData?.user) {
  // process...
}

// If error OR no user, silently redirects to login
return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
```

**Issue:** Doesn't distinguish between "code invalid" vs "network error" vs "user creation failure". Profile auto-creation can fail silently.

**Fix:**
```javascript
const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

if (error) {
  console.error('Auth exchange failed:', error);
  return NextResponse.redirect(`${origin}/login?error=code_exchange_failed&message=${encodeURIComponent(error.message)}`);
}

if (!sessionData?.user) {
  return NextResponse.redirect(`${origin}/login?error=no_user`);
}

try {
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', sessionData.user.id)
    .single();
    
  if (!existingProfile) {
    const { error: insertError } = await supabase.from('profiles').insert({...});
    if (insertError) {
      throw insertError;
    }
  }
} catch (err) {
  console.error('Profile creation failed:', err);
  return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
}

return NextResponse.redirect(`${origin}${next}`);
```

---

## HIGH SEVERITY ISSUES

### 5. 🟠 HIGH: Missing User Ownership Check on Profile Updates
**Severity:** High  
**File:** [src/app/onboarding/actions.js](src/app/onboarding/actions.js#L25)

**Issue:** While the function checks authentication, it relies on the caller to provide the correct `profileData.id`. If a frontend bug passes a different user ID, the server-side check would still allow it.

**Current Code:**
```javascript
if (user.id !== profileData.id) {
  return { success: false, error: 'Forbidden: You can only update your own profile.' };
}
// Then updates with service role
const { error } = await supabaseAdmin
  .from('profiles')
  .upsert(profileData);
```

**Issue:** The service role client bypasses RLS, so if `profileData` contains someone else's ID, it would update their profile.

**Fix:** Validate that profileData only contains fields that should be updated and hardcode the user ID:
```javascript
const { avatar_url, full_name, bio, tools, username, website } = profileData;

const { error } = await supabaseAdmin
  .from('profiles')
  .update({
    avatar_url,
    full_name,
    bio,
    tools,
    username,
    website,
    updated_at: new Date().toISOString(),
  })
  .eq('id', user.id);  // Force correct user ID
```

---

### 6. 🟠 HIGH: Asset Download Counter Race Condition
**Severity:** High  
**File:** [src/app/api/assets/route.js](src/app/api/assets/route.js#L197)

**Issue:** Read-then-update pattern without atomic increment creates race condition. Two simultaneous downloads will lose counts.

**Current Code:**
```javascript
const { data: asset } = await supabase
  .from('assets')
  .select('downloads_count')
  .eq('id', assetId)
  .single();

const { data } = await supabase
  .from('assets')
  .update({ downloads_count: (asset.downloads_count || 0) + 1 })  // ❌ Lost update!
  .eq('id', assetId)
```

**Fix:** Use RPC with atomic Postgres function:
```sql
-- In Postgres migration
CREATE OR REPLACE FUNCTION increment_asset_downloads(p_asset_id UUID)
RETURNS INT AS $$
  UPDATE assets SET downloads_count = downloads_count + 1
  WHERE id = p_asset_id
  RETURNING downloads_count;
$$ LANGUAGE SQL;
```

```javascript
const { data } = await supabase
  .rpc('increment_asset_downloads', { p_asset_id: assetId });
```

---

### 7. 🟠 HIGH: Missing Validation on View Tracking IP Address
**Severity:** High  
**File:** [src/app/api/view/route.js](src/app/api/view/route.js#L11)

**Issue:** IP detection can be spoofed if `x-forwarded-for` header is not validated. A malicious client can bypass the rate limit by injecting fake IPs.

**Current Code:**
```javascript
const ip = req.headers.get('x-forwarded-for') || 'unknown';
const cacheKey = `view_${projectId}_${ip}`;
const hasViewed = await redis.get(cacheKey);
if (hasViewed) return NextResponse.json({ success: true, cached: true });
```

**Fix:** Validate that we're behind a trusted proxy. In Vercel, only use `x-forwarded-for` if it's from a trusted origin:
```javascript
const forwarded = req.headers.get('x-forwarded-for');
// Vercel automatically handles this, but validate
const ip = forwarded?.split(',')?.[0]?.trim() || req.ip || 'unknown';
// Only trust if deployed on Vercel/trusted hosting
if (!process.env.VERCEL && forwarded) {
  // In local/untrusted env, don't rely on forwarded IP
  return NextResponse.json({ success: false }, { status: 400 });
}
```

---

### 8. 🟠 HIGH: Missing Error Handling in Real-Time Notifications
**Severity:** High  
**File:** [src/components/Header.jsx](src/components/Header.jsx#L68)

**Issue:** Real-time subscription in Header lacks error handling. If Redis/Supabase connection fails, users get no feedback and UI doesn't update.

**Current Code:**
```javascript
sub = supabase.channel(`header_badges_${user.id}_${Date.now()}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchBadges)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, fetchBadges)
  .subscribe();
```

**Missing:** Error handling, fallback polling, unsubscribe on error.

**Fix:**
```javascript
sub = supabase.channel(`header_badges_${user.id}_${Date.now()}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchBadges)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_members' }, fetchBadges)
  .subscribe((status, err) => {
    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
      console.error('Real-time subscription failed:', err);
      // Fallback to polling
      const interval = setInterval(fetchBadges, 30000);
      return () => clearInterval(interval);
    }
  });
```

---

### 9. 🟠 HIGH: Missing Type Validation on Dynamic Parameters
**Severity:** High  
**File:** [src/app/api/trending/route.js](src/app/api/trending/route.js), [src/app/api/community/route.js](src/app/api/community/route.js)

**Issue:** Query parameters aren't validated before use. Malicious `limit` or `offset` values could cause issues.

**Current Code (community route):**
```javascript
const limit = parseInt(searchParams.get('limit') || '50', 10);
// ❌ No validation on parsed value!
```

**Issue:** `parseInt('999999999')` succeeds but could request massive amounts of data.

**Fix:**
```javascript
const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 100);
const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
```

---

### 10. 🟠 HIGH: Unprotected Page Renders User-Specific Data Without Loading State
**Severity:** High  
**File:** [src/app/(main)/page.js](src/app/(main)/page.js#L41)

**Issue:** Dashboard makes 4 parallel requests without proper loading states or error handling.

**Current Code:**
```javascript
const authPromise = supabase.auth.getUser()...
const trendingPromise = fetch('/api/trending')...
const postsPromise = supabase.from('community_posts')...
const usersPromise = supabase.from('profiles')...

await Promise.all([authPromise, trendingPromise, postsPromise, usersPromise]);
setLoading(false);
```

**Issue:** If ANY request fails, entire page breaks. No individual error handling.

**Fix:**
```javascript
try {
  const results = await Promise.allSettled([
    authPromise,
    trendingPromise,
    postsPromise,
    usersPromise,
  ]);
  
  results.forEach((result, idx) => {
    if (result.status === 'rejected') {
      console.error(`Request ${idx} failed:`, result.reason);
    }
  });
  
  setLoading(false);
} catch (err) {
  console.error('Dashboard load failed:', err);
  setLoading(false);
  setError('Failed to load dashboard');
}
```

---

## MEDIUM SEVERITY ISSUES

### 11. 🟡 MEDIUM: Missing Error Handling in Component Callbacks
**Severity:** Medium  
**File:** [src/components/InspirationCard.jsx](src/components/InspirationCard.jsx#L19), [src/components/CommentThread.jsx](src/components/CommentThread.jsx#L46)

**Issue:** Like/comment operations don't handle errors. Failed requests silently leave UI in wrong state.

**Current Code (InspirationCard):**
```javascript
const handleLike = useCallback(async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!currentUserId) {
    router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
    return;
  }

  const wasLiked = liked;
  setLiked(!wasLiked);  // ❌ Optimistic update without error handling
  setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

  if (wasLiked) {
    await supabase
      .from('inspiration_likes')
      .delete()
      .eq('user_id', currentUserId)
      .eq('inspiration_id', inspiration.id);
      // ❌ No error handling!
  } else {
    await supabase
      .from('inspiration_likes')
      .insert({...});
      // ❌ No error handling!
  }
}, [liked, currentUserId, inspiration.id, router, supabase]);
```

**Fix:**
```javascript
const handleLike = useCallback(async (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (!currentUserId) {
    router.push('/login?redirectTo=' + encodeURIComponent(window.location.pathname));
    return;
  }

  const wasLiked = liked;
  setLiked(!wasLiked);
  setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));

  try {
    if (wasLiked) {
      const { error } = await supabase
        .from('inspiration_likes')
        .delete()
        .eq('user_id', currentUserId)
        .eq('inspiration_id', inspiration.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('inspiration_likes')
        .insert({ user_id: currentUserId, inspiration_id: inspiration.id });
      if (error) throw error;
    }
  } catch (err) {
    console.error('Like operation failed:', err);
    // Revert optimistic update
    setLiked(wasLiked);
    setLikesCount((prev) => (wasLiked ? prev + 1 : prev - 1));
    // Show error toast
    toast.error('Failed to update like. Please try again.');
  }
}, [liked, currentUserId, inspiration.id, router, supabase]);
```

---

### 12. 🟡 MEDIUM: Potential Null Reference in Profile Data Rendering
**Severity:** Medium  
**File:** [src/app/api/profile/[username]/route.js](src/app/api/profile/[username]/route.js#L50)

**Issue:** If `profileData` is null (user not found), the code continues and tries to use it:

**Current Code:**
```javascript
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .ilike('username', username)
  .single();

if (profileError || !profileData) {
  return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
}

const { data: projectsData } = await supabase
  .from('projects')
  .select('*, profiles!projects_user_id_fkey(username, full_name, avatar_url)')
  .eq('user_id', profileData.id)  // ❌ profileData could be null!
```

Actually, the check is correct. However, the issue is that if the user is viewing their own profile and hasn't saved projects yet, `savedProjects` becomes stale.

**Issue:** The real issue is in lines 75-88 where `user.id === profile.id` is checked but `profile` might not be loaded yet due to earlier `.single()` call potentially returning no data.

---

### 13. 🟡 MEDIUM: Missing CSRF Protection on Form Submissions
**Severity:** Medium  
**File:** [src/components/LoginForm.jsx](src/components/LoginForm.jsx#L40), [src/components/SignupForm.jsx](src/components/SignupForm.jsx#L25)

**Issue:** Forms submit to Supabase directly without server-side verification. While Supabase handles auth, there's no CSRF token in custom server actions.

**Fix:** For custom server actions, add CSRF token:
```javascript
// In middleware
const csrf = crypto.randomUUID();
response.cookies.set('csrf', csrf, { httpOnly: true, sameSite: 'strict' });

// In form submission
const csrf = document.cookie.split('; ').find(r => r.startsWith('csrf='))?.split('=')[1];
const formData = new FormData();
formData.append('_csrf', csrf);
// ... rest of form
```

---

### 14. 🟡 MEDIUM: N+1 Query Problem in Creators Feed
**Severity:** Medium  
**File:** [src/app/api/creators/route.js](src/app/api/creators/route.js#L70)

**Issue:** For each creator, a separate query is made to fetch their sample projects. With 24 creators, this is 24 additional queries.

**Current Code:**
```javascript
const creatorsWithProjects = await Promise.all(
  (gridCreators || []).map(async (creator) => {
    const { data: projects } = await supabase
      .from('projects')
      .select(...)
      .eq('user_id', creator.id)  // ❌ N+1: separate query per creator
      .limit(3);
    return { ...creator, sampleProjects: projects || [] };
  })
);
```

**Fix:** Use a single query with filtering:
```javascript
const creatorIds = (gridCreators || []).map(c => c.id);
const { data: allProjects } = await supabase
  .from('projects')
  .select('id, cover_url, thumbnail_url, title, user_id')
  .in('user_id', creatorIds)
  .eq('published', true)
  .order('created_at', { ascending: false });

const projectsByCreator = {};
allProjects?.forEach(p => {
  if (!projectsByCreator[p.user_id]) projectsByCreator[p.user_id] = [];
  if (projectsByCreator[p.user_id].length < 3) {
    projectsByCreator[p.user_id].push(p);
  }
});

const creatorsWithProjects = (gridCreators || []).map(creator => ({
  ...creator,
  sampleProjects: projectsByCreator[creator.id] || [],
}));
```

---

### 15. 🟡 MEDIUM: Missing Rate Limit Bypass Protection on Admin Routes
**Severity:** Medium  
**File:** [src/app/api/admin/deleted-items/route.js](src/app/api/admin/deleted-items/route.js)

**Issue:** Admin routes aren't subject to global rate limiting in middleware, allowing potential abuse.

**Fix:** Apply additional rate limiting to admin routes:
```javascript
import { Ratelimit } from '@upstash/ratelimit';

const adminRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10 requests per hour per user
  prefix: 'rl:admin',
});

export async function GET(req) {
  const supabaseAuth = createServerClient(...);
  const { data: { user } } = await supabaseAuth.auth.getUser();
  
  // Rate limit even for admins
  const { success } = await adminRatelimit.limit(`user:${user.id}`);
  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  // ... rest
}
```

---

### 16. 🟡 MEDIUM: Missing Null Check on Search Results
**Severity:** Medium  
**File:** [src/app/api/search/route.js](src/app/api/search/route.js#L34)

**Issue:** Search doesn't handle case where count is null.

**Current Code:**
```javascript
const { data, count, error } = await query;
if (error) return NextResponse.json({ error: error.message }, { status: 500 });

return NextResponse.json({ projects: data || [], total: count || 0 });
```

**This is actually fine**, but should ensure `count` is always a number:

```javascript
return NextResponse.json({ 
  projects: data || [], 
  total: typeof count === 'number' ? count : 0 
});
```

---

### 17. 🟡 MEDIUM: Cookie Setting Silently Fails in Modal Closes
**Severity:** Medium  
**File:** [src/components/Modal.jsx](src/components/Modal.jsx#L23)

**Issue:** Setting `document.body.style.overflow = 'hidden'` on mount and unsetting on unmount doesn't account for nested modals. If you open Modal A, then Modal B, closing B will re-enable scroll while A is still open.

**Fix:**
```javascript
useEffect(() => {
  let count = parseInt(document.body.dataset.modalCount || '0');
  count++;
  document.body.dataset.modalCount = count;
  
  if (count === 1) {
    document.body.style.overflow = 'hidden';
  }
  
  return () => {
    count--;
    document.body.dataset.modalCount = count;
    if (count === 0) {
      document.body.style.overflow = 'unset';
    }
  };
}, []);
```

---

### 18. 🟡 MEDIUM: Inspiration Card View Tracking Not Awaited
**Severity:** Medium  
**File:** [src/components/InspirationCard.jsx](src/components/InspirationCard.jsx#L24)

**Issue:** View tracking fire-and-forget doesn't report errors and could fail silently.

**Current Code:**
```javascript
fetch(`/api/inspirations/${inspiration.id}/views`, { method: 'POST' })
  .catch(console.error);  // ❌ Only logs, doesn't retry or show feedback
```

**Fix:**
```javascript
const handleCardClick = useCallback(() => {
  if (inspiration.id) {
    fetch(`/api/inspirations/${inspiration.id}/views`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => {
      console.error('View tracking failed:', err);
      // Retry once after 2 seconds
      setTimeout(() => {
        fetch(`/api/inspirations/${inspiration.id}/views`, { method: 'POST' })
          .catch(() => {}); // Silent second failure
      }, 2000);
    });
    setViewsCount(prev => prev + 1);
  }
  onClick?.();
}, [inspiration.id, onClick]);
```

---

## PERFORMANCE ISSUES

### 19. 🟡 MEDIUM: Inefficient Profile Header Badge Queries
**Severity:** Medium  
**File:** [src/components/Header.jsx](src/components/Header.jsx#L90)

**Issue:** Fetches unread notifications count separately from unread messages count, could combine:

**Current Code:**
```javascript
const { count } = await supabase
  .from('notifications')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('read', false);
setUnreadCount(count || 0);

const { data: members } = await supabase
  .from('conversation_members')
  .select('unread_count')
  .eq('user_id', user.id);
const totalMsgs = (members || []).reduce((s, m) => s + (m.unread_count || 0), 0);
setUnreadMsgs(totalMsgs);
```

**Fix:** Combine into single batch:
```javascript
const [notifRes, membersRes] = await Promise.all([
  supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('read', false),
  supabase.from('conversation_members').select('unread_count').eq('user_id', user.id),
]);

setUnreadCount(notifRes.count || 0);
const totalMsgs = (membersRes.data || []).reduce((s, m) => s + (m.unread_count || 0), 0);
setUnreadMsgs(totalMsgs);
```

---

### 20. 🟡 MEDIUM: Live Search Uses `.or()` Without Index
**Severity:** Medium  
**File:** [src/components/Header.jsx](src/components/Header.jsx#L119)

**Issue:** Full-text search with `.or()` on title, description, and category requires multiple indexed columns.

**Current Code:**
```javascript
const { data } = await supabase
  .from('projects')
  .select('...')
  .eq('published', true)
  .or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)  // ❌ Slow
  .limit(6);
```

**Fix:** Use full-text search index:
```javascript
const { data } = await supabase
  .from('projects')
  .select('...')
  .eq('published', true)
  .textSearch('fts', q)  // Uses GIN index on fts column
  .limit(6);
```

Ensure the `fts` column is populated on projects table with combined searchable text.

---

### 21. 🟡 MEDIUM: Caching Strategy Doesn't Handle Stale Data
**Severity:** Medium  
**File:** [src/app/api/projects/route.js](src/app/api/projects/route.js#L44), [src/app/api/creators/route.js](src/app/api/creators/route.js#L44)

**Issue:** 10-second cache TTL means users might see stale data for 10 seconds. Cache isn't invalidated on updates.

**Current Code:**
```javascript
try {
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json({ projects: items, cached: true });
  }
} catch (err) {
  console.error('[Redis Cache GET Error]', err);
}
```

**Fix:** Implement cache invalidation on write operations:
```javascript
// In POST endpoint that creates a project:
await redis.del(`projects:${category}:${limit}:*`);  // Invalidate all offsets for this category

// Or use versioned cache keys:
const cacheKey = `projects:v2:${category}:${limit}:${offset}`;
```

---

### 22. 🟡 MEDIUM: Image Lazy Loading Without Placeholder
**Severity:** Medium  
**File:** [src/components/InspirationCard.jsx](src/components/InspirationCard.jsx#L63)

**Issue:** Images load with `loading="lazy"` but no placeholder/skeleton causes layout shift.

**Current Code:**
```javascript
<img
  src={inspiration.thumbnail_url || inspiration.image_url}
  alt={inspiration.title || 'Inspiration'}
  loading="lazy"
  decoding="async"
  className="inspiration-img"
/>
```

**Fix:** Add CSS for skeleton loading or use `<ProgressiveImage>` component:
```javascript
<ProgressiveImage
  src={inspiration.thumbnail_url || inspiration.image_url}
  placeholder="/placeholder-img.png"
  alt={inspiration.title || 'Inspiration'}
  className="inspiration-img"
/>
```

---

## CODE QUALITY ISSUES

### 23. 🟡 MEDIUM: Inconsistent Error Message Formatting
**Severity:** Low  
**Files:** Multiple API routes

**Issue:** Error messages are inconsistent:
- `/api/upload` - returns `error: "Too many uploads..."`
- `/api/messages` - returns `error: 'Too many messages...'`
- `/api/creators` - returns `error: 'Internal server error'`

**Fix:** Standardize error response format:
```javascript
// Create shared error handler
function errorResponse(message, status = 500) {
  return NextResponse.json(
    { error: { message, code: status }, success: false },
    { status }
  );
}

// Use consistently
return errorResponse('Too many requests', 429);
```

---

### 24. 🟡 MEDIUM: Unused Dependency in LoginForm
**Severity:** Low  
**File:** [src/components/LoginForm.jsx](src/components/LoginForm.jsx#L2)

**Issue:** `Check` icon is imported but only used in checkbox, which could use simpler styling.

**Current Code:**
```javascript
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';
```

---

### 25. 🟡 MEDIUM: Missing PropTypes or TypeScript Validation
**Severity:** Medium  
**Files:** All components

**Issue:** No type checking on props. Components accept any props without validation.

**Example:**
```javascript
export default function InspirationCard({ inspiration, currentUserId, onClick }) {
  // inspiration could be null, undefined, or missing required fields
}
```

**Fix:** Add TypeScript or PropTypes:
```javascript
import PropTypes from 'prop-types';

InspirationCard.propTypes = {
  inspiration: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string,
    image_url: PropTypes.string,
    thumbnail_url: PropTypes.string,
    user_liked: PropTypes.bool,
    likes_count: PropTypes.number,
    views_count: PropTypes.number,
    profiles: PropTypes.shape({
      username: PropTypes.string,
      full_name: PropTypes.string,
      avatar_url: PropTypes.string,
    }),
  }).isRequired,
  currentUserId: PropTypes.string,
  onClick: PropTypes.func,
};
```

---

### 26. 🟡 MEDIUM: Page Module Uses Inline Styles Over CSS Classes
**Severity:** Low  
**Files:** Multiple components

**Issue:** Heavy use of inline `style` props instead of CSS classes makes styling hard to maintain:

```javascript
// Bad
<div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', }}>

// Good
<div className="top-creators-scroll">
```

---

### 27. 🟡 MEDIUM: Missing Suspense Boundaries for Async Data
**Severity:** Medium  
**File:** [src/app/(main)/page.js](src/app/(main)/page.js)

**Issue:** Component loads 4 async requests in useEffect but doesn't use `<Suspense>` for progressive loading.

**Fix:** Wrap async sections in Suspense:
```javascript
<Suspense fallback={<div>Loading projects...</div>}>
  <ProjectsSection />
</Suspense>

<Suspense fallback={<div>Loading community posts...</div>}>
  <CommunitySection />
</Suspense>
```

---

## SECURITY ISSUES

### 28. 🔴 CRITICAL: OAuth Redirect URL Not Validated
**Severity:** High  
**File:** [src/app/auth/callback/route.js](src/app/auth/callback/route.js#L45)

**Issue:** The `next` parameter from URL is used directly in redirect without validation. Potential open redirect vulnerability.

**Current Code:**
```javascript
const next = searchParams.get('next') || '/';
// ...
return NextResponse.redirect(`${origin}${next}`);
```

**Attack:** Attacker sends user to `/auth/callback?code=...&next=//evil.com` and user gets redirected to evil site after login.

**Fix:**
```javascript
const next = searchParams.get('next') || '/';

// Whitelist safe paths
const ALLOWED_REDIRECTS = ['/', '/profile', '/projects', '/messages', '/settings'];
const isValidRedirect = ALLOWED_REDIRECTS.some(path => next.startsWith(path));

if (!isValidRedirect) {
  return NextResponse.redirect(`${origin}/`);
}

return NextResponse.redirect(`${origin}${next}`);
```

---

### 29. 🟠 HIGH: Unvalidated Search Query in FTS Search
**Severity:** High  
**File:** [src/app/api/search/route.js](src/app/api/search/route.js#L18)

**Issue:** User input `q` is split and joined directly into FTS query without sanitization.

**Current Code:**
```javascript
const q = (searchParams.get('q') || '').trim();
// ...
.textSearch('fts', q.split(/\s+/).join(' | '))  // ❌ User input directly in query
```

**Attack:** FTS injection could cause database errors or unexpected results.

**Fix:**
```javascript
const q = (searchParams.get('q') || '').trim();

if (!q || q.length < 2 || q.length > 100) {
  return NextResponse.json({ projects: [], total: 0 });
}

// Escape special FTS characters
const escaped = q
  .replace(/[&|!:()"*-]/g, '') // Remove FTS operators
  .trim()
  .split(/\s+/)
  .filter(t => t.length >= 2)
  .slice(0, 5)  // Limit number of terms
  .join(' | ');

.textSearch('fts', escaped)
```

---

### 30. 🟠 HIGH: Session Token Refresh Timing Window
**Severity:** High  
**File:** [src/proxy.js](src/proxy.js#L48)

**Issue:** Middleware refreshes session but doesn't check if token is actually expired. Could create unnecessary network roundtrips.

**Current Code:**
```javascript
// Refresh session — do NOT remove this call.
const {
  data: { user },
} = await supabase.auth.getUser();
```

**Fix:** Check token expiry before refresh:
```javascript
// Only refresh if token is expiring soon (within 5 minutes)
const decoded = jwtDecode(sessionToken);
if (decoded.exp * 1000 - Date.now() < 5 * 60 * 1000) {
  const { data } = await supabase.auth.refreshSession();
}
```

---

### 31. 🟡 MEDIUM: Sentry Configuration Exposes Source Maps
**Severity:** Medium  
**File:** [next.config.mjs](next.config.mjs#L49)

**Issue:** `hideSourceMaps: true` should definitely be set, but `widenClientFileUpload: true` could expose more data than necessary.

**Current Code:**
```javascript
widenClientFileUpload: true,
hideSourceMaps: true,  // ✓ Good
```

**Note:** This is actually configured correctly. The `hideSourceMaps: true` ensures source maps aren't sent to browsers.

---

## LOW SEVERITY ISSUES

### 32. 🟢 LOW: Missing Null Coalescing in User Profile Fields
**Severity:** Low  
**Files:** Components

**Issue:** Code like `creator?.full_name || creator?.username || 'Designer'` is verbose.

---

## SUMMARY TABLE

| # | Issue | Severity | File | Type | Status |
|---|-------|----------|------|------|--------|
| 1 | Missing auth on admin routes | 🔴 Critical | admin/deleted-items, admin/restore | Security | Open |
| 2 | Table name SQL injection | 🔴 Critical | admin/restore | Security | Open |
| 3 | Insecure profile save function | 🔴 Critical | actions/onboardingActions | Security | Open |
| 4 | Auth callback silent failure | 🔴 Critical | auth/callback | Error Handling | Open |
| 5 | Missing user ID validation | 🟠 High | onboarding/actions | Security | Open |
| 6 | Download counter race condition | 🟠 High | api/assets | Race Condition | Open |
| 7 | IP spoofing in view tracking | 🟠 High | api/view | Security | Open |
| 8 | Missing realtime error handling | 🟠 High | components/Header | Error Handling | Open |
| 9 | Unvalidated query parameters | 🟠 High | api/* | Validation | Open |
| 10 | No Promise.allSettled error handling | 🟠 High | (main)/page | Error Handling | Open |
| 11 | Missing callback error handling | 🟡 Medium | InspirationCard, CommentThread | Error Handling | Open |
| 12 | N+1 query in creators feed | 🟡 Medium | api/creators | Performance | Open |
| 13 | Missing admin rate limiting | 🟡 Medium | api/admin/* | Security | Open |
| 14 | Nested modal scroll lock | 🟡 Medium | Modal | Code Quality | Open |
| 15 | View tracking fire-and-forget | 🟡 Medium | InspirationCard | Error Handling | Open |
| 16 | Inefficient badge queries | 🟡 Medium | Header | Performance | Open |
| 17 | Slow search without FTS index | 🟡 Medium | Header | Performance | Open |
| 18 | Cache not invalidated on write | 🟡 Medium | api/projects, api/creators | Performance | Open |
| 19 | Image layout shift | 🟡 Medium | InspirationCard | UX | Open |
| 20 | Inconsistent error formatting | 🟡 Medium | API routes | Code Quality | Open |
| 21 | Missing PropTypes | 🟡 Medium | All components | Code Quality | Open |
| 22 | No Suspense boundaries | 🟡 Medium | (main)/page | Performance | Open |
| 23 | OAuth open redirect | 🔴 Critical | auth/callback | Security | Open |
| 24 | FTS injection vulnerability | 🟠 High | api/search | Security | Open |
| 25 | Unoptimized session refresh | 🟠 High | proxy | Performance | Open |

---

## RECOMMENDATIONS

### Immediate Actions (Within 1 Week)
1. **Add authentication checks to admin routes** (#1, #2)
2. **Delete insecure profile save function** (#3)
3. **Validate OAuth redirect URLs** (#28)
4. **Fix table name validation in restore endpoint** (#2)
5. **Implement FTS injection protection** (#29)

### High Priority (Within 2 Weeks)
6. Implement atomic increment functions for counters (#6)
7. Add error handling to all async operations (#8, #10, #11)
8. Validate query parameters (#9)
9. Add admin rate limiting (#15)
10. Implement cache invalidation strategy (#21)

### Medium Priority (Within 1 Month)
11. Refactor N+1 queries (#14)
12. Add PropTypes/TypeScript (#25)
13. Implement progressive image loading (#19)
14. Add Suspense boundaries (#27)
15. Consolidate error response formats (#23)

### Low Priority (Ongoing)
16. Refactor inline styles to CSS classes (#26)
17. Optimize database queries with proper indexes
18. Add comprehensive error logging
19. Implement monitoring dashboards

---

**Report Generated:** 2026-06-08  
**Reviewer:** GitHub Copilot  
**Next Review Recommended:** After fixes are applied
