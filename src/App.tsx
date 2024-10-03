import { createAgent, DIDDocument, ICredentialPlugin, IDataStore, IDIDManager, IKeyManager, IResolver, ManagedKeyInfo, VerifiableCredential, VerifiablePresentation } from '@veramo/core';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { KeyManager, MemoryKeyStore } from '@veramo/key-manager';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { useCallback, useEffect, useState } from 'react';

import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia } from '@reown/appkit/networks';
import { createAppKit } from '@reown/appkit/react';
import { CredentialProviderEIP712 } from '@veramo/credential-eip712';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { Buffer } from 'buffer';
import { CredentialProviderEip712JWT } from 'credential-eip712jwt';
import { Resolver } from 'did-resolver';
import { getResolver as getEthrDidResolver } from "ethr-did-resolver";
import AccountSelector from './components/AccountSelector';
import CredentialDisplay from './components/CredentialDisplay';
import CredentialIssuer from './components/CredentialIssuer';
import CredentialValidator from './components/CredentialValidator';
import DidDisplay from './components/DidDisplay';
import PresentationCreator from './components/PresentationCreator';
import PresentationDisplay from './components/PresentationDisplay';
import PresentationValidator from './components/PresentationValidator';
import WalletConnection from './components/WalletConnection';
import { changeOwner, ConfiguredAgent, getDidDocument } from './utils';


declare global {
  interface Window {
    // ethereum?: MetaMaskInpageProvider
    Buffer: typeof Buffer
  }
}

window.Buffer = Buffer;

// 1. Get projectId
const projectId: string = import.meta.env.VITE_WALLETCONNECT_ID

// 2. Set the networks
const networks = [sepolia, mainnet];
console.log("Networks: ", networks);

const metadata = {
  name: 'test',
  description: 'My Website description',
  url: 'http://localhost:5173', // origin must match your domain & subdomain
  icons: ['https://avatars.mywebsite.com/']
}

// 4. Create a AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: false // Optional - defaults to your Cloud configuration
  }
})

function App() {

  const [kms, setKms] = useState<Web3KeyManagementSystem | null>(null);
  const [keys, setKeys] = useState<ManagedKeyInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<ManagedKeyInfo | null>(null);
  const [agent, setAgent] = useState<ConfiguredAgent | null>(null);
  const [newOwner, setNewOwner] = useState<string>('');
  const [selectedDidDoc, setSelectedDidDoc] = useState<string | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('');
  const [verifiableCredential, setVerifiableCredential] = useState<VerifiableCredential | null>(null);

  const [verifiablePresentation, setVerifiablePresentation] = useState<VerifiablePresentation | null>(null);
  // const [presentationValidated, setPresentationValidated] = useState<string>("");


  const importDids = useCallback(async () => {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    if (!keys) {
      throw new Error('No keys found');
    }

    keys.forEach(async (key) => {
      const did = `did:ethr:sepolia:${key.meta?.account.address}`;
      const importedDid = await agent.didManagerImport({
        did,
        provider: 'did:ethr:sepolia',
        keys: [{
          kid: key.kid,
          type: 'Secp256k1',
          kms: 'web3',
          publicKeyHex: key.publicKeyHex,
          meta: key.meta,
          privateKeyHex: "",
        }]
      });
      console.log("DID created: ", importedDid);
      const test = await agent.resolveDid({ didUrl: did })
      console.log("DID resolved: ", test);
    });
  }, [agent, keys]);

  const createCustomAgent = useCallback(async () => {
    const didStore = new MemoryDIDStore();
    const keyStore = new MemoryKeyStore();

    const registries = {
      mainnet: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
      sepolia: '0x03d5003bf0e79c5f5223588f347eba39afbc3818'
    }


    if (!kms) {
      throw new Error('KMS not initialized');
    }
    const veramoAgent = createAgent<IDIDManager & IResolver & ICredentialPlugin & IDataStore & IKeyManager>({
      plugins: [
        new KeyManager({
          store: keyStore,
          kms: {
            web3: kms
          }
        }),
        new DIDManager({
          store: didStore,
          defaultProvider: 'did:ethr',
          providers: {
            'did:ethr': new EthrDIDProvider({
              defaultKms: 'web3',
              registry: registries['mainnet'],
              rpcUrl: 'https://cloudflare-eth.com'
            }),
            'did:ethr:sepolia': new EthrDIDProvider({
              defaultKms: 'web3',
              registry: registries['sepolia'],
              rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com'
            })
          }
        }),
        new DIDResolverPlugin({
          resolver: new Resolver(getEthrDidResolver({
            networks: [
              {
                name: 'mainnet',
                registry: registries['mainnet'],
                rpcUrl: 'https://mainnet.infura.io/v3/707f7fa6bee6474196a78bf7622503f5'
              },
              {
                name: 'sepolia',
                registry: registries['sepolia'],
                rpcUrl: 'https://sepolia.infura.io/v3/707f7fa6bee6474196a78bf7622503f5'
              }
            ]
          })),
        }),
        new CredentialPlugin({
          issuers: [new CredentialProviderEIP712(), new CredentialProviderEip712JWT()]
        })
      ]
    });
    console.log("Agent created: ", veramoAgent);

    setAgent(veramoAgent);
  }, [kms, setAgent]);

  useEffect(() => {
    if (kms && !agent) {
      createCustomAgent();
    }
    if (agent) {
      importDids();
    }
  }, [kms, createCustomAgent, agent, importDids]);

  useEffect(() => {

    const resolve = async () => {
      if (selectedKey && agent) {
        const data = await getDidDocument(agent, selectedKey);
        setSelectedDidDoc(JSON.stringify(data.didDocument, null, 2));
      }
    }
    resolve();
  }, [selectedKey, agent]);

  const handleUpdateOwner = async () => {
    if (agent && newOwner && selectedDidDoc) {
      const didDoc = JSON.parse(selectedDidDoc) as DIDDocument
      await changeOwner(agent, didDoc.id, newOwner);
    } else {
      console.error('Agente, DID o nuevo propietario no están configurados');
    }
  };

  return <>
    <WalletConnection setKms={setKms} setKeys={setKeys} />
    <div style={{ marginBottom: '20px' }}></div>
    {keys.length > 0 && (
      <AccountSelector
        keys={keys}
        selectedKey={selectedKey}
        setSelectedKey={setSelectedKey}
      />
    )}
    {selectedDidDoc != null && (<DidDisplay selectedDidDoc={selectedDidDoc} />)}
    {selectedDidDoc != null && (<CredentialIssuer
      agent={agent}
      selectedKey={selectedKey}
      setSelectedAlgorithm={setSelectedAlgorithm}
      setVerifiableCredential={setVerifiableCredential}
    />)}
    {verifiableCredential != null && (<CredentialDisplay verifiableCredential={verifiableCredential} />)}
    {verifiableCredential != null && (<CredentialValidator
      agent={agent}
      verifiableCredential={verifiableCredential}
    />)}
    {verifiableCredential != null && <PresentationCreator
      agent={agent}
      selectedAlgorithm={selectedAlgorithm}
      selectedKey={selectedKey}
      verifiableCredential={verifiableCredential}
      setVerifiablePresentation={setVerifiablePresentation}
    />}
    {verifiablePresentation != null && <PresentationDisplay verifiablePresentation={verifiablePresentation} />}
    {verifiablePresentation != null && <PresentationValidator
      agent={agent}
      verifiablePresentation={verifiablePresentation}
    />
    }
    {selectedDidDoc != null &&
    <input 
      type="text" 
      placeholder="Nuevo propietario (dirección ETH)" 
      value={newOwner} 
      onChange={(e) => setNewOwner(e.target.value)} 
    />}
    
    {/* Botón para ejecutar el cambio de propietario */}
    <button onClick={handleUpdateOwner}>
      Actualizar Propietario
    </button>
  
    </>
}
    


export default App;