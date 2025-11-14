import React, { useState } from 'react';
import { MailIcon, LockClosedIcon } from '../ui/Icons';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db, isFirebaseConfigValid } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { generateAvatar } from '../ui/Avatar';

interface SignupPageProps {
    onNavigate: (page: 'login') => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isFirebaseConfigValid()) {
            setError("Firebase configuration is missing or invalid. Please check your firebaseConfig.ts file.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords don't match.");
            return;
        }
        setLoading(true);
        if (email && password) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const userName = user.email?.split('@')[0] || 'New User';
                // Create user profile in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    name: userName,
                    avatarUrl: generateAvatar(userName),
                });
                // Auth state change will handle navigation
            } catch (err: any) {
                console.error("Signup failed:", err);
                if (err.code === 'auth/email-already-in-use') {
                    setError('An account with this email already exists.');
                } else if (err.code === 'auth/invalid-api-key') {
                     setError('Firebase API Key is invalid. Please check your firebaseConfig.ts file.');
                }
                else {
                    setError('Failed to create an account. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-brand-dark">Create an Account</h2>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <MailIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="you@example.com" />
                    </div>
                </div>
                <div>
                    <label htmlFor="password"className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="••••••••" minLength={6} />
                    </div>
                </div>
                <div>
                    <label htmlFor="confirm-password"className="block text-sm font-medium text-gray-700">Confirm Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="••••••••" />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
                    {loading ? 'Creating account...' : 'Sign Up'}
                </button>
            </form>
            <p className="text-sm text-center text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={() => onNavigate('login')} className="font-medium text-brand-accent hover:text-brand-primary">Login</button>
            </p>
        </div>
    );
};

export default SignupPage;