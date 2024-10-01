import { useState } from 'react';
import Dropdown from './Dropdown';
import { issueCredential } from '../utils';

const CredentialIssuer = ({ agent, selectedKey, setSelectedAlgorithm, setVerifiableCredential }) => {
  const [inputSubject, setInputSubject] = useState('');
  const [signatureType, setSignatureType] = useState('');

  const handleInputChange = (event) => {
    setInputSubject(event.target.value);
    console.log('Subject:', event.target.value);
  };

  const handleDropdownSelect = (option) => {
    setSignatureType(option.value);
    setSelectedAlgorithm(option.value);
  };

  const handleIssueCredential = async () => {
    const credential = await issueCredential(agent, selectedKey, inputSubject, signatureType);
    setVerifiableCredential(credential);
  };

  const options = [
    { value: 'EthTypedDataSignature', label: 'EthTypedDataSignature' },
    { value: 'EthereumEip712Signature2021', label: 'EthereumEip712Signature2021' }
  ];

  return (
    <div>
      <input
        type="text"
        value={inputSubject}
        onChange={handleInputChange}
        placeholder="Enter subject"
      />
      <Dropdown
        options={options}
        onSelect={handleDropdownSelect}
        placeholder="Choose signature type"
      />
      <button onClick={handleIssueCredential}>Issue Credential</button>
    </div>
  );
};

export default CredentialIssuer;