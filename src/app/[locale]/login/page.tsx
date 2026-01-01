'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { TextField, Button, Card } from '@/components/ui';
import { Lock, Mail } from 'lucide-react';
// import { login } from '@/lib/api';
import { toast } from 'sonner';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@salah.com');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // const data = await login({ email, password });
      const data = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      }).then((res) => res.json());
      if (data && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        toast.success('Login successful!');
        router.push('/dashboard');
      } else {
        toast.error('Login failed: No access token received.');
        throw new Error('Login failed: No access token received.');
      }
    } catch (error) {
      toast.error('Invalid credentials! Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col justify-center items-center p-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-4xl font-bold text-primary-600 mb-2'>
          Salah<span className='text-gray-600 dark:text-gray-300'>SaaS</span>
        </h1>
        <p className='text-gray-500'>School Management System</p>
      </div>

      <Card className='w-full max-w-md'>
        <h2 className='text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center'>
          Admin Login
        </h2>
        <form onSubmit={handleLogin}>
          <TextField
            label='Email Address'
            type='email'
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label='Password'
            type='password'
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <div className='flex justify-end mb-6'>
            <a
              href='#'
              className='text-sm text-primary-600 hover:text-primary-700'
            >
              Forgot password?
            </a>
          </div>
          <Button type='submit' fullWidth isLoading={isLoading}>
            Sign In
          </Button>
        </form>

        <div className='mt-6 text-center text-sm text-gray-500'>
          <p>Demo Credentials:</p>
          <p>Email: admin@salah.com</p>
          <p>Password: admin</p>
        </div>
      </Card>
    </div>
  );
}
