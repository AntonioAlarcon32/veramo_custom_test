import React from 'react';

const PresentationValidator = ({ validatePresentation, presentationValidated }) => {
  return (
    <div>
      <button onClick={validatePresentation}>Validate Presentation</button>
      <h3>Presentation validation result</h3>
      <h4>{presentationValidated}</h4>
    </div>
  );
};

export default PresentationValidator;