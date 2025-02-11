
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // New field for signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
  
    try {
      if (isSignUp) {
        await signUp(email, password, name);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }
    const LoadingSpinner = () => (
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
      </div>
    );

  // Function to populate the fields with random guest data and sign up
  const handleGuestSignup = () => {
    // Random email and password for guest login
    const guestEmail = `guest${Math.floor(Math.random() * 1000)}@gmail.com`;
    const guestPassword = 'GuestPassword123'; // You can randomize this too if needed
    const guestName = `Guest User`;

    // Set the email, password, and name state with the guest data
    setEmail(guestEmail);
    setPassword(guestPassword);
    setName(guestName);

    // Call signUp instead of signIn for guest user
    signUp(guestEmail, guestPassword, guestName)
      .then(() => navigate('/')) // Redirect to dashboard or home
      .catch((err) => setError(err instanceof Error ? err.message : 'An error occurred'));
  };

  return (
    <div className="max-h-screen bg-gray-50/5 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md ">
        <div className="flex justify-center">
          <Briefcase className="w-12 h-12 text-indigo-600" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-extrabold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md ">
        <div className="bg-white py-8 px-4 shadow rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Show these fields only if user is signing up */}
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </>
            )}

            {/* Email & Password fields (always visible) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {isSignUp ? (loading?(
                      <div className="flex items-center">
                        <LoadingSpinner />
                      </div>
                    ):("Sign Up")) : (loading?(
                      <div className="flex items-center">
                        <LoadingSpinner />
                      </div>
                    ):("Sign In")) }
              </button>
            </div>
          </form>

          {/* Toggle between Sign Up & Sign In */}
          <div className="mt-6">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center text-sm text-indigo-600 hover:text-indigo-500"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Button for guest signup */}
          <div className="mt-4">
            <button
              onClick={handleGuestSignup}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Sign up as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
