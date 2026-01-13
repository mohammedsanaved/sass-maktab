'use client';

import React, { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { TextField, Button, Card } from '@/components/ui';
import { Lock, Mail } from 'lucide-react';
// import { login } from '@/lib/api';
import { toast } from 'sonner';

import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@salah.com');
  const [password, setPassword] = useState('admin');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
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
    <div className='min-h-screen flex bg-background overflow-hidden'>
      {/* Branding Section - Hidden on Mobile */}
      <div className='hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 bg-primary-600 text-white overflow-hidden'>
        {/* Abstract Background Pattern/Gradient */}
        <div className='absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 opacity-90' />
        <div className='absolute -top-24 -left-24 w-96 h-96 bg-primary-400 rounded-full blur-3xl opacity-20' />
        <div className='absolute -bottom-24 -right-24 w-96 h-96 bg-primary-800 rounded-full blur-3xl opacity-30' />

        <div className='relative z-10 text-center'>
          <div className='mb-8 inline-block p-4 bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 transform hover:scale-105 transition-transform duration-300'>
            <Image
              src='/logo.png'
              alt='Maktab Logo'
              width={160}
              height={160}
              className='drop-shadow-2xl'
            />
          </div>
          <h1 className='text-5xl font-extrabold tracking-tight mb-4 drop-shadow-lg uppercase'>
            Maktab <span className='text-primary-100'>Muhammadiya</span>
          </h1>
          <p className='text-xl text-primary-100/90 font-medium max-w-md mx-auto'>
            Premium Education Management System for a modern world.
          </p>
        </div>

        {/* Footer branding */}
        <div className='absolute bottom-8 left-12 right-12 flex justify-between items-center text-primary-200/60 text-sm font-medium border-t border-white/10 pt-4'>
          <span>© 2026 Maktab Muhammadiya</span>
          <span>By <a href="https://codikt.com" target="_blank" rel="noopener noreferrer" className='text-primary-200 hover:text-primary-100 transition-colors duration-300'>Codikt</a></span>
        </div>
      </div>

      {/* Form Section */}
      <div className='w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900'>
        <div className='w-full max-w-md'>
          {/* Mobile Logo Branding */}
          <div className='lg:hidden text-center mb-10'>
            <div className='mb-4 flex justify-center'>
              <Image src='/logo.png' alt='Logo' width={80} height={80} />
            </div>
            <h1 className='text-3xl font-bold text-primary-600'>
              Maktab <span className='text-gray-900 dark:text-white'>Muhammadiya</span>
            </h1>
          </div>

          <Card variant='neubrutal' className='w-full border-none !p-0 overflow-hidden shadow-2xl'>
            <div className='p-8'>
              <div className='mb-8'>
                <h2 className='text-3xl font-bold text-foreground mb-2'>
                  Welcome Back
                </h2>
                <p className='text-gray-500'>Please enter your details to sign in.</p>
              </div>

              <form onSubmit={handleLogin} className='space-y-2'>
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
                <div className='flex items-center justify-between mb-8'>
                  <div className='flex items-center'>
                    <input
                      id='remember-me'
                      type='checkbox'
                      className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer'
                    />
                    <label
                      htmlFor='remember-me'
                      className='ml-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer'
                    >
                      Remember me
                    </label>
                  </div>
                  <a
                    href='#'
                    className='text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors'
                  >
                    Forgot password?
                  </a>
                </div>
                <Button type='submit' fullWidth size='lg' isLoading={isLoading} className='shadow-lg'>
                  Sign In
                </Button>
              </form>

              <div className='mt-10 pt-8 border-t border-gray-100 dark:border-gray-800'>
                <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4'>
                  Quick Test Credentials
                </p>
                <div className='flex flex-wrap gap-2 text-xs'>
                  <span className='px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono'>
                    Email: admin@salah.com
                  </span>
                  <span className='px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono'>
                    Pass: admin
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
