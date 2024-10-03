import { useState } from 'react';
import Dropdown from './Dropdown';
import { Option } from './Dropdown';
import { ConfiguredAgent, issueCredential } from '../utils';
import { ManagedKeyInfo, VerifiableCredential } from '@veramo/core';

interface CredentialIssuerProps {
  agent: ConfiguredAgent | null;
  selectedKey: ManagedKeyInfo | null;
  setSelectedAlgorithm: React.Dispatch<React.SetStateAction<string | null>>;
  setVerifiableCredential: React.Dispatch<React.SetStateAction<VerifiableCredential | null>>;
}

const CredentialIssuer: React.FC<CredentialIssuerProps> = ({
  agent,
  selectedKey,
  setSelectedAlgorithm,
  setVerifiableCredential,
}) => {
  const [inputSubject, setInputSubject] = useState('');
  const [signatureType, setSignatureType] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputSubject(event.target.value);
    console.log('Subject:', event.target.value);
  };

  const handleDropdownSelect = (option: Option) => {
    setSignatureType(option.value);
    setSelectedAlgorithm(option.value);
  };

  const handleIssueCredential = async () => {
    if (!agent) {
      console.error('No agent selected');
      return;
    }
    if (!selectedKey) {
      console.error('No key selected');
      return;
    }
    const credential = await issueCredential(agent, selectedKey, inputSubject, signatureType);
    setVerifiableCredential(credential);
  };

  const options = [
    { value: 'EthTypedDataSignature', label: 'EthTypedDataSignature' },
    {
      value: 'EthereumEip712Signature2021',
      label: 'EthereumEip712Signature2021',
    },
  ];

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Issue Credential</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={inputSubject}
            onChange={handleInputChange}
            placeholder="Enter subject"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Signature Type</label>
          <Dropdown options={options} onSelect={handleDropdownSelect} placeholder="Choose signature type" />
        </div>
        <button
          onClick={handleIssueCredential}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
          disabled={!inputSubject || !signatureType}
        >
          Issue Credential
        </button>
      </div>
    </div>
  );
};

export default CredentialIssuer;
