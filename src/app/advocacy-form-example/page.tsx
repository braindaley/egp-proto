
'use client';

import React from 'react';
import AdvocacyMessageForm from '../../components/AdvocacyMessageForm';

const AdvocacyFormExamplePage: React.FC = () => {
  const handleSubmit = (data: any) => {
    console.log('Form submitted with:', data);
    alert('Form submitted! Check the console for the data.');
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Advocacy Message Form Example</h1>
      <AdvocacyMessageForm
        billType="defense"
        recipientCategory="party_leader"
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default AdvocacyFormExamplePage;
