import { useState } from 'react';
import { validatePresentation } from '../utils'

const PresentationValidator = ({ agent, verifiablePresentation }) => {

  const [presentationValidated, setPresentationValidated] = useState<string>("");

  const handleValidatePresentation = async () => {
    const result = await validatePresentation(agent, verifiablePresentation);
    if (result === true) {
      setPresentationValidated("Credential is valid")
    } else {
      setPresentationValidated("Credential is not valid")
    }

  }

  return (
    <div>
      <button onClick={handleValidatePresentation}>Validate Presentation</button>
      <h3>Presentation validation result</h3>
      <h4>{presentationValidated}</h4>
    </div>
  );
};

export default PresentationValidator;