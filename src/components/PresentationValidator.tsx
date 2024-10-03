import { useState } from 'react';
import { ConfiguredAgent, validatePresentation } from '../utils';
import { VerifiablePresentation } from '@veramo/core';

interface PresentationValidatorProps {
  agent: ConfiguredAgent | null;
  verifiablePresentation: VerifiablePresentation | null;
}

const PresentationValidator: React.FC<PresentationValidatorProps> = ({ agent, verifiablePresentation }) => {
  const [presentationValidated, setPresentationValidated] = useState<string>('');
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidatePresentation = async () => {
    if (!agent) {
      setError('No agent selected');
      return;
    }

    if (!verifiablePresentation) {
      setError('No presentation selected');
      return;
    }

    setIsValidating(true);
    setError(null);
    setPresentationValidated('');

    try {
      const result = await validatePresentation(agent, verifiablePresentation);
      setPresentationValidated(result ? 'Presentation is valid' : 'Presentation is not valid');
    } catch (err) {
      setError('Validation failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Validate Presentation</h2>
      <button
        onClick={handleValidatePresentation}
        disabled={isValidating || !verifiablePresentation}
        className={`w-full ${
          isValidating || !verifiablePresentation ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out mb-4`}
      >
        {isValidating ? 'Validating...' : 'Validate Presentation'}
      </button>
      {presentationValidated && (
        <div
          className={`mt-4 p-4 rounded-md ${
            presentationValidated.includes('valid') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          <p className="font-semibold">{presentationValidated}</p>
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
          <p className="font-semibold">Error: {error}</p>
        </div>
      )}
      {!verifiablePresentation && !error && (
        <div className="mt-4 p-4 bg-yellow-100 text-yellow-800 rounded-md">
          <p className="font-semibold">Please create a Verifiable Presentation first.</p>
        </div>
      )}
    </div>
  );
};

export default PresentationValidator;
