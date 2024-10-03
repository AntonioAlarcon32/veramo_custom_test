import { useState } from 'react';
import { ManagedKeyInfo, VerifiableCredential, VerifiablePresentation } from '@veramo/core';
import { ConfiguredAgent, createVerifiablePresentation } from '../utils';

interface PresentationCreatorProps {
  agent: ConfiguredAgent | null;
  selectedKey: ManagedKeyInfo | null;
  verifiableCredential: VerifiableCredential | null;
  selectedAlgorithm: string | null;
  setVerifiablePresentation: React.Dispatch<React.SetStateAction<VerifiablePresentation | null>>;
}

const PresentationCreator: React.FC<PresentationCreatorProps> = ({
  agent,
  selectedKey,
  verifiableCredential,
  selectedAlgorithm,
  setVerifiablePresentation,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePresentation = async () => {
    if (!agent) {
      setError('No agent selected');
      return;
    }

    if (!selectedKey) {
      setError('No key selected');
      return;
    }

    if (!verifiableCredential) {
      setError('No credential selected');
      return;
    }

    if (!selectedAlgorithm) {
      setError('No algorithm selected');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const presentation = await createVerifiablePresentation(
        agent,
        selectedKey,
        verifiableCredential,
        selectedAlgorithm
      );
      setVerifiablePresentation(presentation);
    } catch (err) {
      setError('Failed to create presentation: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Presentation</h2>
      <button
        onClick={handleCreatePresentation}
        disabled={isCreating || !verifiableCredential || !selectedAlgorithm}
        className={`w-full ${
          isCreating || !verifiableCredential || !selectedAlgorithm
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out`}
      >
        {isCreating ? 'Creating Presentation...' : 'Create Presentation'}
      </button>
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
          <p className="font-semibold">Error: {error}</p>
        </div>
      )}
      {!error && !verifiableCredential && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p className="font-semibold">Please create a Verifiable Credential first.</p>
        </div>
      )}
      {!error && verifiableCredential && !selectedAlgorithm && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p className="font-semibold">Please select a signature algorithm.</p>
        </div>
      )}
    </div>
  );
};

export default PresentationCreator;
