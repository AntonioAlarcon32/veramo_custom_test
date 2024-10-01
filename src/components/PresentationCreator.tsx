import { createVerifiablePresentation } from "../utils";

const PresentationCreator = ({ agent, selectedKey, verifiableCredential, selectedAlgorithm, setVerifiablePresentation }) => {

  const handleIssuePresentation = async () => {
    const presentation = await createVerifiablePresentation(agent, selectedKey, verifiableCredential, selectedAlgorithm);
    setVerifiablePresentation(presentation);
  }

  return (
    <div>
      <button onClick={handleIssuePresentation}>Create Presentation</button>
    </div>
  );
};

export default PresentationCreator;