import React, { useState } from 'react';
import { MailIcon } from '../ui/Icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, isFirebaseConfigValid } from '../../firebaseConfig';

interface ForgotPasswordPageProps {
    onNavigate: (page: 'login') => void;
}

const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        if (!isFirebaseConfigValid()) {
            setError("Firebase configuration is missing or invalid. Please check your firebaseConfig.ts file.");
            setLoading(false);
            return;
        }

        if (email) {
            try {
                await sendPasswordResetEmail(auth, email);
                setMessage(`If an account exists for ${email}, a password reset link has been sent.`);
            } catch (err: any) {
                setError("Failed to send reset email. Please check the address and try again.");
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-brand-dark">Reset Password</h2>
            {error && <p className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative text-sm">{error}</p>}
            {message && <p className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative text-sm">{message}</p>}

            {!message && (
                 <p className="text-sm text-center text-gray-500">Enter your email and we'll send you a link to get back into your account.</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {!message && (
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MailIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} required className="focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2" placeholder="you@example.com" />
                        </div>
                    </div>
                )}
                {!message && (
                    <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-gray-400">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                )}
            </form>
            <p className="text-sm text-center text-gray-600">
                <button type="button" onClick={() => onNavigate('login')} className="font-medium text-brand-accent hover:text-brand-primary">Back to Login</button>
            </p>
        </div>
    );
};

export default ForgotPasswordPage;