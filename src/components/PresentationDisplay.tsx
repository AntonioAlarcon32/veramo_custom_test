import { useState } from 'react';
import { VerifiablePresentation } from '@veramo/core';

interface PresentationDisplayProps {
  verifiablePresentation: VerifiablePresentation | null;
}

const PresentationDisplay: React.FC<PresentationDisplayProps> = ({ verifiablePresentation }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = () => {
    if (verifiablePresentation) {
      navigator.clipboard
        .writeText(JSON.stringify(verifiablePresentation, null, 2))
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        })
        .catch((err) => console.error('Failed to copy: ', err));
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Created Verifiable Presentation</h2>
      {verifiablePresentation ? (
        <>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {JSON.stringify(verifiablePresentation, null, 2)}
            </pre>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCopyToClipboard}
              className={`${
                isCopied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out`}
            >
              {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </>
      ) : (
        <div className="bg-yellow-100 text-yellow-800 p-4 rounded-md">
          <p className="font-semibold">No Verifiable Presentation has been created yet.</p>
        </div>
      )}
    </div>
  );
};

export default PresentationDisplay;
