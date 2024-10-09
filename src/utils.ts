import {
  DIDResolutionResult,
  ICredentialPlugin,
  IDataStore,
  IDIDManager,
  IKeyManager,
  IResolver,
  ManagedKeyInfo,
  TAgent,
  VerifiableCredential,
  VerifiablePresentation,
} from '@veramo/core';

import { BrowserProvider } from 'ethers';
import { Contract } from 'ethers';
import { ethers } from 'ethers';
import { Signer } from 'ethers/providers';
import { EthrDidController } from 'ethr-did-resolver';


const contractAddress = '0x03d5003bf0e79c5f5223588f347eba39afbc3818';
const contractABI = [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "identity", "type": "address" }, { "indexed": false, "internalType": "bytes32", "name": "name", "type": "bytes32" }, { "indexed": false, "internalType": "bytes", "name": "value", "type": "bytes" }, { "indexed": false, "internalType": "uint256", "name": "validTo", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "previousChange", "type": "uint256" }], "name": "DIDAttributeChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "identity", "type": "address" }, { "indexed": false, "internalType": "bytes32", "name": "delegateType", "type": "bytes32" }, { "indexed": false, "internalType": "address", "name": "delegate", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "validTo", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "previousChange", "type": "uint256" }], "name": "DIDDelegateChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "identity", "type": "address" }, { "indexed": false, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "previousChange", "type": "uint256" }], "name": "DIDOwnerChanged", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "bytes32", "name": "delegateType", "type": "bytes32" }, { "internalType": "address", "name": "delegate", "type": "address" }, { "internalType": "uint256", "name": "validity", "type": "uint256" }], "name": "addDelegate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "uint8", "name": "sigV", "type": "uint8" }, { "internalType": "bytes32", "name": "sigR", "type": "bytes32" }, { "internalType": "bytes32", "name": "sigS", "type": "bytes32" }, { "internalType": "bytes32", "name": "delegateType", "type": "bytes32" }, { "internalType": "address", "name": "delegate", "type": "address" }, { "internalType": "uint256", "name": "validity", "type": "uint256" }], "name": "addDelegateSigned", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "address", "name": "newOwner", "type": "address" }], "name": "changeOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "uint8", "name": "sigV", "type": "uint8" }, { "internalType": "bytes32", "name": "sigR", "type": "bytes32" }, { "internalType": "bytes32", "name": "sigS", "type": "bytes32" }, { "internalType": "address", "name": "newOwner", "type": "address" }], "name": "changeOwnerSigned", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "changed", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "bytes32", "name": "", "type": "bytes32" }, { "internalType": "address", "name": "", "type": "address" }], "name": "delegates", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }], "name": "identityOwner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "nonce", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "owners", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "bytes32", "name": "name", "type": "bytes32" }, { "internalType": "bytes", "name": "value", "type": "bytes" }], "name": "revokeAttribute", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "uint8", "name": "sigV", "type": "uint8" }, { "internalType": "bytes32", "name": "sigR", "type": "bytes32" }, { "internalType": "bytes32", "name": "sigS", "type": "bytes32" }, { "internalType": "bytes32", "name": "name", "type": "bytes32" }, { "internalType": "bytes", "name": "value", "type": "bytes" }], "name": "revokeAttributeSigned", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "bytes32", "name": "delegateType", "type": "bytes32" }, { "internalType": "address", "name": "delegate", "type": "address" }], "name": "revokeDelegate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "uint8", "name": "sigV", "type": "uint8" }, { "internalType": "bytes32", "name": "sigR", "type": "bytes32" }, { "internalType": "bytes32", "name": "sigS", "type": "bytes32" }, { "internalType": "bytes32", "name": "delegateType", "type": "bytes32" }, { "internalType": "address", "name": "delegate", "type": "address" }], "name": "revokeDelegateSigned", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "bytes32", "name": "name", "type": "bytes32" }, { "internalType": "bytes", "name": "value", "type": "bytes" }, { "internalType": "uint256", "name": "validity", "type": "uint256" }], "name": "setAttribute", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "uint8", "name": "sigV", "type": "uint8" }, { "internalType": "bytes32", "name": "sigR", "type": "bytes32" }, { "internalType": "bytes32", "name": "sigS", "type": "bytes32" }, { "internalType": "bytes32", "name": "name", "type": "bytes32" }, { "internalType": "bytes", "name": "value", "type": "bytes" }, { "internalType": "uint256", "name": "validity", "type": "uint256" }], "name": "setAttributeSigned", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "identity", "type": "address" }, { "internalType": "bytes32", "name": "delegateType", "type": "bytes32" }, { "internalType": "address", "name": "delegate", "type": "address" }], "name": "validDelegate", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }];


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

  return didDocument;
}

async function issueCredential(
  agent: ConfiguredAgent,
  selectedKey: ManagedKeyInfo,
  inputSubject: string,
  selectedAlgorithm: string
): Promise<VerifiableCredential> {
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
        degree: 'Telecom Engineer',
        college: 'EETAC',
        university: 'UPC',
      },
    },
    proofFormat: selectedAlgorithm,
  });
  console.log('Credential created');
  return credential;
}

async function validateCredential(
  agent: ConfiguredAgent,
  verifiableCredential: VerifiableCredential
): Promise<boolean> {
  if (!agent) {
    throw new Error('Agent not initialized');
  }

  if (!verifiableCredential) {
    throw new Error('No credential selected');
  }

  const result = await agent.verifyCredential({
    credential: verifiableCredential,
  });
  return result.verified;
}

async function createVerifiablePresentation(
  agent: ConfiguredAgent,
  selectedKey: ManagedKeyInfo,
  verifiableCredential: VerifiableCredential,
  selectedAlgorithm: string
) {
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

async function validatePresentation(
  agent: ConfiguredAgent,
  verifiablePresentation: VerifiablePresentation
): Promise<boolean> {
  if (!agent) {
    throw new Error('Agent not initialized');
  }

  if (!verifiablePresentation) {
    throw new Error('No presentation selected');
  }

  const result = await agent.verifyPresentation({
    presentation: verifiablePresentation,
  });

  return result.verified;
}

async function changeOwner(
browserProvider: BrowserProvider, 
agent: ConfiguredAgent, 
signer: Signer,
identity: string,
newOwner: string): Promise<void> {
  if (!agent) {
    throw new Error('Agent not initialized');
  }
  if (!browserProvider) {
    throw new Error('Browser provider not initialized');
  }
  if (!ethers.isAddress(newOwner)) {
    alert('La dirección del DID no es válida');
    return;
  }

  try {

  const contract = new Contract(contractAddress, contractABI, signer);
  
  console.log('tx:', contract);
  await new EthrDidController(identity, contract, signer).changeOwner(newOwner)

  }
   
  catch (error) {
    console.error('Error changing owner:', error);
  }
}

export async function addDelegate(
  browserProvider: BrowserProvider,
  agent: ConfiguredAgent,
  signer: Signer,
  identity: string,
  delegate: string,
  expiresIn: number
) {
  if (!browserProvider || !agent || !signer || !delegate ) {
    throw new Error('Missing required parameters');
  }
  try {
  const contract = new Contract(contractAddress, contractABI, signer);
  await new EthrDidController(identity, contract, signer).addDelegate('sigAuth', delegate, expiresIn)
  console.log('Delegate added:', delegate);
  }
  catch (error) {
    console.error('Error adding delegate:', error);
  }
}

export async function revokeDelegate(
  browserProvider: BrowserProvider,
  agent: ConfiguredAgent,
  signer: Signer,
  identity: string,
  delegate: string
) {
  if (!browserProvider || !agent || !signer || !delegate) {
    throw new Error('Missing required parameters');
  }
  try {
    const contract = new Contract(contractAddress, contractABI, signer);
    await new EthrDidController(identity, contract, signer).revokeDelegate('sigAuth', delegate);
    console.log('Delegate revoked:', delegate);
  } catch (error) {
    console.error('Error revoking delegate:', error);
  }
}


export {
  type ConfiguredAgent,
  issueCredential,
  validateCredential,
  createVerifiablePresentation,
  validatePresentation,
  getDidDocument,
  changeOwner,
};
