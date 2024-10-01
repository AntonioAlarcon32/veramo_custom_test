import React from 'react';

const PresentationDisplay = ({ verifiablePresentation }) => {
  return (
    <div>
      <h3>Created Verifiable Presentation</h3>
      <pre>{JSON.stringify(verifiablePresentation, null, 4)}</pre>
    </div>
  );
};

export default PresentationDisplay;