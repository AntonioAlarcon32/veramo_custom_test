const DidDisplay = ({ selectedDidDoc }: { selectedDidDoc: string}) => {
  return (
    <div>
      <h3>Selected DID</h3>
      <pre>{selectedDidDoc}</pre>
    </div>
  );
};

export default DidDisplay;