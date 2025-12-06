const BASE_URL = 'http://localhost:3000/api/auth';

async function testAuth() {
  console.log('Starting Auth Verification...');

  // 1. Register Admin
  const adminEmail = `admin_${Date.now()}@example.com`;
  const password = 'password123';
  console.log(`\n1. Registering Admin (${adminEmail})...`);
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: adminEmail,
      password,
      role: 'ADMIN',
      name: 'Test Admin',
    }),
  });
  console.log('Register Status:', regRes.status);
  const regData = await regRes.json();
  console.log('Register Response:', regData);

  if (regRes.status !== 201) {
    console.error('Registration failed. Aborting.');
    return;
  }

  // 2. Login
  console.log('\n2. Logging in...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password }),
  });
  console.log('Login Status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login Response:', loginData);

  if (loginRes.status !== 200) {
    console.error('Login failed. Aborting.');
    return;
  }

  const accessToken = loginData.accessToken;
  // Extract cookies from response headers (Node.js fetch doesn't auto-store cookies like a browser)
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Cookies received:', cookies);

  // 3. Profile (Protected)
  console.log('\n3. Accessing Profile...');
  const profileRes = await fetch(`${BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  console.log('Profile Status:', profileRes.status);
  const profileData = await profileRes.json();
  console.log('Profile Response:', profileData);

  // 4. Refresh Token
  console.log('\n4. Refreshing Token...');
  const refreshRes = await fetch(`${BASE_URL}/refresh`, {
    method: 'POST',
    headers: { Cookie: cookies || '' },
  });
  console.log('Refresh Status:', refreshRes.status);
  const refreshData = await refreshRes.json();
  console.log('Refresh Response:', refreshData);

  // 5. Logout
  console.log('\n5. Logging out...');
  const logoutRes = await fetch(`${BASE_URL}/logout`, {
    method: 'POST',
    headers: { Cookie: cookies || '' },
  });
  console.log('Logout Status:', logoutRes.status);

  // 6. Profile after Logout (Should fail if we rely on cookie, but here we use accessToken which is still valid until expiry. 
  // However, if we try to refresh again, it should fail.)
  console.log('\n6. Refreshing Token after Logout (Should fail)...');
  const refreshRes2 = await fetch(`${BASE_URL}/refresh`, {
    method: 'POST',
    headers: { Cookie: logoutRes.headers.get('set-cookie') || '' }, // Should have cleared cookie
  });
  console.log('Refresh 2 Status:', refreshRes2.status);
}

testAuth();
