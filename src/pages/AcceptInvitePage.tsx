
import React from 'react';
import AcceptInvitation from '@/components/AcceptInvitation';

const AcceptInvitePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Company
          </h1>
          <p className="text-gray-600">
            Accept your invitation to join a company
          </p>
        </div>
        <AcceptInvitation />
      </div>
    </div>
  );
};

export default AcceptInvitePage;
