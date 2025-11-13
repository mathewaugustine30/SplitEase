import React, { useState } from 'react';
import { MailIcon, LockClosedIcon } from '../ui/Icons';

interface SignupPageProps {
    onSignup: (email: string, pass: string) => void;
    onNavigate: (page: 'login') => void;
    error: string;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSignup, onNavigate, error }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        if (password !== confirmPassword) {
            setLocalError("Passwords don't match.");
            return;
        }
        if (email && password) {
            onSignup(email, password);
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-brand-dark">Create an Account</h2>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">{error}</p>}
            {localError && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">{localError}</p>}
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
                        <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} required className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="••••••••" />
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
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary">
                    Sign Up
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
