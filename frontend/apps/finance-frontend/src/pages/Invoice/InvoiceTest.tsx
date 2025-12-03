import React from 'react';

const InvoiceTest: React.FC = () => {
  console.log('✅ InvoiceTest component rendered successfully!');
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-4xl font-bold text-green-600 mb-4">✅ Success!</h1>
          <p className="text-xl text-gray-700 mb-4">
            Invoice page is loading correctly!
          </p>
          <p className="text-gray-600">
            This is a test page to verify React rendering is working.
          </p>
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-900">Check Browser Console (F12)</p>
            <p className="text-sm text-blue-700">You should see: "✅ InvoiceTest component rendered successfully!"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceTest;
