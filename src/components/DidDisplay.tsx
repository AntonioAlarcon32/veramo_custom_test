import React from 'react';

const DidDisplay = ({ selectedDid }) => {
  return (
    <div>
      <h3>Selected DID</h3>
      <pre>{selectedDid}</pre>
    </div>
  );
};

export default DidDisplay;