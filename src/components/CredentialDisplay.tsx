import React from 'react';

const CredentialDisplay = ({ verifiableCredential }) => {
  return (
    <div>
      <h3>Created Verifiable Credential</h3>
      <pre>{JSON.stringify(verifiableCredential, null, 4)}</pre>
    </div>
  );
};

export default CredentialDisplay;