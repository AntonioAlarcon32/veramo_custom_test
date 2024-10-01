import React from 'react';

const CredentialValidator = ({ validateCredential, credentialValidated }) => {
  return (
    <div>
      <button onClick={validateCredential}>Validate Credential</button>
      <h3>Credential validation result</h3>
      <h4>{credentialValidated}</h4>
    </div>
  );
};

export default CredentialValidator;