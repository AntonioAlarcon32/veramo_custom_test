import React from 'react';

const PresentationCreator = ({ createVerifiablePresentation }) => {
  return (
    <div>
      <button onClick={createVerifiablePresentation}>Create Presentation</button>
    </div>
  );
};

export default PresentationCreator;