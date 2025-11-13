import React, { ReactNode } from 'react';

const AuthLayout: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-brand-primary">SplitEase</h1>
            <p className="text-gray-600 mt-1">Your simple expense splitter</p>
        </div>
        <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
            {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
