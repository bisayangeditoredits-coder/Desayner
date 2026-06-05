const fs = require('fs');
const path = require('path');
const dirs = ['asset-store', 'mockups', 'tutorials', 'job-board', 'challenges', 'inspirations'];
const content = `import Link from 'next/link';

export default function ComingSoonPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', color: '#0a0a0a' }}>🚀 Coming Soon</h1>
      <p style={{ fontSize: '1.1rem', color: '#6b7280', maxWidth: '500px', marginBottom: '2rem', lineHeight: '1.6' }}>
        We are working hard to build this page. Stay tuned for amazing new features coming to Desayner very soon!
      </p>
      <Link href="/" style={{ padding: '0.75rem 1.5rem', background: '#0a0a0a', color: 'white', fontWeight: 700, borderRadius: '8px', textDecoration: 'none' }}>
        Return to Home
      </Link>
    </div>
  );
}`;

dirs.forEach(d => {
  const p = path.join('d:/CRELDESK/CreldeskStudio/src/app/(main)', d);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
  fs.writeFileSync(path.join(p, 'page.js'), content);
});
console.log('Created coming soon pages!');
