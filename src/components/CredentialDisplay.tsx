import { VerifiableCredential } from '@veramo/core';

interface CredentialDisplayProps {
  verifiableCredential: VerifiableCredential;
}

const CredentialDisplay: React.FC<CredentialDisplayProps> = ({ verifiableCredential }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Created Verifiable Credential</h2>
      <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {JSON.stringify(verifiableCredential, null, 2)}
        </pre>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => navigator.clipboard.writeText(JSON.stringify(verifiableCredential, null, 2))}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          Copy to Clipboard
        </button>
      </div>
    </div>
  );
};

export default CredentialDisplay;
