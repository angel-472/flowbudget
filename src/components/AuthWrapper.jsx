import React, { useState, useEffect } from 'react';
import { getCurrentUser, signIn, signUp, signOut, onAuthStateChange } from '../auth.js';

export default function AuthWrapper({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check current user on mount
    getCurrentUser().then(user => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await signUp(email, password);
        setError('Check your email for confirmation link!');
      } else {
        await signIn(email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">FlowBudget</h2>
            <p className="mt-2 text-gray-600">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>
          
          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              {isSignUp 
                ? 'Already have an account? Sign in' 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-900">FlowBudget</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          <button
            onClick={handleSignOut}
            className="text-sm text-red-600 hover:text-red-500"
          >
            Sign Out
          </button>
        </div>
      </div>
      {typeof children === 'function' ? children(user) : children}
    </div>
  );
}