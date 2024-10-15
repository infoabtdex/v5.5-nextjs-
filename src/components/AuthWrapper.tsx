'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from './Navigation'
import { onAuthStateChange, signOut } from '../services/firebaseService'
import { User } from 'firebase/auth'

const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChange((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/auth/login-signup');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {children}
      {user && <Navigation user={user} onLogout={handleLogout} />}
    </>
  );
};

export default AuthWrapper;
