import { useState } from 'react';
import { validateCredential } from '../utils';


const CredentialValidator = ({ agent, verifiableCredential }) => {

  const [credentialValidated, setCredentialValidated] = useState<string>("");

  const handleValidateCredential = async () => {
    const result = await validateCredential(agent, verifiableCredential);
    if (result === true) {
      setCredentialValidated("Credential is valid")
    } else {
      setCredentialValidated("Credential is not valid")
    }

  }

  return (
    <div>
      <button onClick={handleValidateCredential}>Validate Credential</button>
      <h3>Credential validation result</h3>
      <h4>{credentialValidated}</h4>
    </div>
  );
};

export default CredentialValidator;