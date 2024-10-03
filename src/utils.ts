import { DIDResolutionResult, ICredentialPlugin, IDataStore, IDIDManager, IKeyManager, IResolver, ManagedKeyInfo, TAgent, VerifiableCredential, VerifiablePresentation } from "@veramo/core";
import { ethers } from 'ethers';


type ConfiguredAgent = TAgent<IDIDManager & IResolver & ICredentialPlugin & IDataStore & IKeyManager>;


async function getDidDocument(agent: ConfiguredAgent, selectedKey: ManagedKeyInfo): Promise<DIDResolutionResult> {
    if (!agent) {
        throw new Error('Agent not initialized');
    }

    if (!selectedKey) {
        throw new Error('No key selected');
    }

    const did = `did:ethr:sepolia:${selectedKey.meta?.account.address}`;

    const didDocument = await agent.resolveDid({ didUrl: did });

    return didDocument
}


async function issueCredential(agent: ConfiguredAgent, selectedKey: ManagedKeyInfo, inputSubject: string, selectedAlgorithm: string): Promise<VerifiableCredential> {
    if (!agent) {
        throw new Error('Agent not initialized');
    }

    if (!selectedKey) {
        throw new Error('No key selected');
    }

    if (!inputSubject) {
        throw new Error('No input subject');
    }

    if (selectedAlgorithm === '') {
        throw new Error('No algorithm selected');
    }

    const did = `did:ethr:sepolia:${selectedKey.meta?.account.address}`;

    const credential = await agent.createVerifiableCredential({
        credential: {
            issuer: { id: did },
            credentialSubject: {
                id: inputSubject,
                alumni: true,
                degree: "Telecom Engineer",
                college: "EETAC",
                university: "UPC",
            },
        },
        proofFormat: selectedAlgorithm,
    });
    console.log("Credential created")
    return credential
}

async function validateCredential(agent: ConfiguredAgent, verifiableCredential: VerifiableCredential): Promise<boolean> {
    if (!agent) {
        throw new Error('Agent not initialized');
    }

    if (!verifiableCredential) {
        throw new Error('No credential selected');
    }

    const result = await agent.verifyCredential({
        credential: verifiableCredential,
    });
    return result.verified
}

async function createVerifiablePresentation(agent: ConfiguredAgent, selectedKey: ManagedKeyInfo, verifiableCredential: VerifiableCredential, selectedAlgorithm: string) {
    if (!agent) {
        throw new Error('Agent not initialized');
    }

    if (!selectedKey) {
        throw new Error('No key selected');
    }

    if (!verifiableCredential) {
        throw new Error('No verifiable credential');
    }

    if (selectedAlgorithm === '') {
        throw new Error('No algorithm selected');
    }

    const did = `did:ethr:sepolia:${selectedKey.meta?.account.address}`;
    const presentation = await agent.createVerifiablePresentation({
        presentation: {
            holder: did,
            verifiableCredential: [verifiableCredential],
        },
        proofFormat: selectedAlgorithm,
    });

    return presentation;
}

async function validatePresentation(agent: ConfiguredAgent, verifiablePresentation: VerifiablePresentation): Promise<boolean> {
    if (!agent) {
        throw new Error('Agent not initialized');
    }

    if (!verifiablePresentation) {
        throw new Error('No presentation selected');
    }

    const result = await agent.verifyPresentation({
        presentation: verifiablePresentation,
    });

    return result.verified
}

async function changeOwner(agent: ConfiguredAgent, ownerDid: string, newOwnerAddress:string) {
    if (!agent) {
         console.error('Agent not initialized');
         return;
     }

     if (!ownerDid) {
        throw new Error('No owner did selected');
        
    }
    console.log(`ownerDid: ${ownerDid}`)
 
     if (!ethers.isAddress(newOwnerAddress)) {
         console.error('La dirección proporcionada no es válida');
         return;
     }
    
     try {
  
          const documentUpdate = {
            controller: [newOwnerAddress], // Lista con la nueva dirección como controlador
          };
          console.log(`newowner: ${newOwnerAddress}`);
          console.log(`documentupdate: ${documentUpdate}`);
           const result = await agent.didManagerUpdate({
            did: ownerDid,      
            document: documentUpdate,
            options: {},

        });
 
         console.log(`DID ethereum account address updated to: ${newOwnerAddress}`);
         console.log(`result: ${result}`);
         return result;
     } catch (error) {
         console.error('Error al actualizar el owner del DID:', error);
     }
 }

export { type ConfiguredAgent, issueCredential, validateCredential, createVerifiablePresentation, validatePresentation, getDidDocument, changeOwner }

