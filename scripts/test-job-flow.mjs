const API = 'http://localhost:3001/api/v1';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`login failed: ${res.status} ${JSON.stringify(body)}`);
  return body.accessToken;
}

async function req(path, token, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, ok: res.ok, body };
}

const checks = [];

async function check(name, fn) {
  try {
    await fn();
    checks.push({ name, ok: true });
    console.log(`OK  ${name}`);
  } catch (err) {
    checks.push({ name, ok: false, err: String(err.message || err) });
    console.log(`FAIL ${name}: ${err.message || err}`);
  }
}

await check('health', async () => {
  const r = await req('/health');
  if (r.status !== 200) throw new Error(`status ${r.status}`);
});

await check('public jobs list with pagination', async () => {
  const r = await req('/jobs?page=1&limit=20');
  if (r.status !== 200) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
  if (!r.body?.items?.length) throw new Error('no published jobs returned');
});

const token = await login('recruiter@moons.com', 'password123');

await check('recruiter jobs mine', async () => {
  const r = await req('/jobs/mine', token);
  if (r.status !== 200 || !Array.isArray(r.body) || !r.body.length) {
    throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
  }
});

let jobId;
await check('create job', async () => {
  const r = await req('/jobs', token, {
    method: 'POST',
    body: JSON.stringify({
      title: 'E2E Test Role',
      companyName: 'Moons QA',
      description: 'Automated end-to-end verification job posting for QA.',
      location: 'Remote',
      employmentType: 'FULL_TIME',
    }),
  });
  if (r.status !== 201 && r.status !== 200) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
  jobId = r.body.id;
});

await check('patch job', async () => {
  const r = await req(`/jobs/${jobId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ title: 'E2E Updated Role' }),
  });
  if (r.status === 404) throw new Error('route missing - stale API on port 3001');
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
});

await check('close job', async () => {
  const r = await req(`/jobs/${jobId}/close`, token, { method: 'POST' });
  if (r.status === 404) throw new Error('route missing - stale API on port 3001');
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
  if (r.body.status !== 'CLOSED') throw new Error(`expected CLOSED, got ${r.body.status}`);
});

await check('delete job', async () => {
  const r = await req(`/jobs/${jobId}`, token, { method: 'DELETE' });
  if (r.status === 404) throw new Error('route missing - stale API on port 3001');
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(r.body)}`);
});

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  process.exitCode = 1;
  console.log('\nSome checks failed.');
} else {
  console.log('\nAll job flow checks passed.');
}
