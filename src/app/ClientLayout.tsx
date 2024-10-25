'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthWrapper from '../components/AuthWrapper'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthChecked(true);
      if (!user && window.location.pathname !== '/auth/login-signup') {
        router.push('/auth/login-signup');
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (!isAuthChecked) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AuthWrapper>
        <main className="flex-grow">{children}</main>
      </AuthWrapper>
    </div>
  );
}
