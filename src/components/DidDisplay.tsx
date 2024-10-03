import { DIDDocument } from '@veramo/core';

interface DidDisplayProps {
  selectedDidDocument: DIDDocument | null;
}

const DidDisplay: React.FC<DidDisplayProps> = ({ selectedDidDocument }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Selected DID</h2>
      <div className="bg-gray-100 p-4 rounded-md">
        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {selectedDidDocument != null && JSON.stringify(selectedDidDocument, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DidDisplay;
