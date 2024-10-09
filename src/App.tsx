import { useCallback, useEffect, useState } from 'react';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { KeyManager } from '@veramo/key-manager';
import {
  ManagedKeyInfo,
  IDIDManager,
  IResolver,
  createAgent,
  ICredentialPlugin,
  IDataStore,
  IKeyManager,
  VerifiableCredential,
  VerifiablePresentation,
  DIDResolutionResult,
  DIDDocument,
} from '@veramo/core';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { MemoryKeyStore } from '@veramo/key-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { getResolver as getEthrDidResolver } from 'ethr-did-resolver';
import { Resolver } from 'did-resolver';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { CredentialProviderEIP712 } from '@veramo/credential-eip712';
import { Buffer } from 'buffer';
import { CredentialProviderEip712JWT } from 'credential-eip712jwt';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, sepolia } from '@reown/appkit/networks';
import WalletConnection from './components/WalletConnection';
import AccountSelector from './components/AccountSelector';
import DidDisplay from './components/DidDisplay';
import CredentialIssuer from './components/CredentialIssuer';
import CredentialDisplay from './components/CredentialDisplay';
import CredentialValidator from './components/CredentialValidator';
import PresentationCreator from './components/PresentationCreator';
import PresentationDisplay from './components/PresentationDisplay';
import PresentationValidator from './components/PresentationValidator';
import { addDelegate, changeOwner, ConfiguredAgent, getDidDocument } from './utils';
import { BrowserProvider, Signer } from 'ethers';

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

window.Buffer = Buffer;

// 1. Get projectId
const projectId: string = import.meta.env.VITE_WALLETCONNECT_ID;

// 2. Set the networks
const networks = [sepolia, mainnet];
console.log('Networks: ', networks);

const metadata = {
  name: 'test',
  description: 'My Website description',
  url: 'http://localhost:5173', // origin must match your domain & subdomain
  icons: ['https://avatars.mywebsite.com/'],
};

// 4. Create a AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
    swaps: false, // Optional - defaults to your Cloud configuration
    onramp: false, // Optional - defaults to your Cloud configuration
    history: false, // Optional - defaults to your Cloud configuration
  },
});

function App() {
  const [kms, setKms] = useState<Web3KeyManagementSystem | null>(null);
  const [keys, setKeys] = useState<ManagedKeyInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<ManagedKeyInfo | null>(null);
  const [agent, setAgent] = useState<ConfiguredAgent | null>(null);
  const [selectedDidDocument, setSelectedDidDocument] = useState<DIDDocument | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);
  const [verifiableCredential, setVerifiableCredential] = useState<VerifiableCredential | null>(null);
  const [verifiablePresentation, setVerifiablePresentation] = useState<VerifiablePresentation | null>(null);
  const [browserProvider, setBrowserProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [delegateAddress, setDelegateAddress] = useState<string>('');
  const [expirationTime, setExpirationTime] = useState(3600);
  

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
        controllerKeyId: key.kid,
        provider: 'did:ethr:sepolia',
        keys: [
          {
            kid: key.kid,
            type: 'Secp256k1',
            kms: 'web3',
            publicKeyHex: key.publicKeyHex,
            meta: key.meta,
            privateKeyHex: '',
          },
        ],
      });
      console.log('DID created: ', importedDid);
      const test = await agent.resolveDid({ didUrl: did });
      console.log('DID resolved: ', test);
    });
  }, [agent, keys]);

  const createCustomAgent = useCallback(async () => {
    const didStore = new MemoryDIDStore();
    const keyStore = new MemoryKeyStore();

    const registries = {
      mainnet: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
      sepolia: '0x03d5003bf0e79c5f5223588f347eba39afbc3818',
    };

    if (!kms || !browserProvider) {
      throw new Error('KMS not initialized');
    }
    const veramoAgent = createAgent<IDIDManager & IResolver & ICredentialPlugin & IDataStore & IKeyManager>({
      plugins: [
        new KeyManager({
          store: keyStore,
          kms: {
            web3: kms,
          },
        }),
        new DIDManager({
          store: didStore,
          defaultProvider: 'did:ethr',
          providers: {
            'did:ethr': new EthrDIDProvider({
              defaultKms: 'web3',
              registry: registries['mainnet'],
              web3Provider: browserProvider,
            }),
            'did:ethr:sepolia': new EthrDIDProvider({
              defaultKms: 'web3',
              registry: registries['sepolia'],
              web3Provider: browserProvider,
            }),
          },
        }),
        new DIDResolverPlugin({
          resolver: new Resolver(
            getEthrDidResolver({
              networks: [
                {
                  name: 'mainnet',
                  registry: registries['mainnet'],
                  provider: browserProvider,
                  signer: browserProvider.getSigner(),
                },
                {
                  name: 'sepolia',
                  registry: registries['sepolia'],
                  provider: browserProvider,
                  signer: browserProvider.getSigner(),
                },
              ],
            })
          ),
        }),
        new CredentialPlugin({
          issuers: [new CredentialProviderEIP712(), new CredentialProviderEip712JWT()],
        }),
      ],
    });
    console.log('Agent created: ', veramoAgent);

    setAgent(veramoAgent);
  }, [kms, setAgent, browserProvider]);

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
        const data: DIDResolutionResult = await getDidDocument(agent, selectedKey);
        console.log('DID Document: ', data.didDocument);
        setSelectedDidDocument(data.didDocument);
      }
    };
    resolve();
  }, [selectedKey, agent]);
  const handleChangeOwner = useCallback(async () => {
    if (!browserProvider) {
      throw new Error('Browser provider not initialized');
    }

    const newOwner = prompt('Please enter the new owner address:');
    if (!newOwner) {
      alert('New owner address is required');
      return;
    }
    const signer = await browserProvider.getSigner();
    const identity = `did:ethr:sepolia:${selectedKey?.meta?.account.address}`; // Assuming you want to change the owner of the selected key's DID
    
    changeOwner(browserProvider, agent, signer, identity, newOwner);
  }, [browserProvider, agent, selectedKey]);

  const handleAddDelegate = useCallback(async () => {
    if (!browserProvider) {
      throw new Error('Browser provider not initialized');
    }
  
    const signer = await browserProvider.getSigner();
    const identity = `did:ethr:sepolia:${selectedKey?.meta?.account.address}`; // Assuming you want to add a delegate to the selected key's DID
  
    await addDelegate(browserProvider, agent, signer, identity, delegateAddress, expirationTime);
  }, [browserProvider, agent, selectedKey,delegateAddress,expirationTime]);

  return (
    <>
      <WalletConnection setKms={setKms} setKeys={setKeys} setBrowserProvider={setBrowserProvider} setSigner = {setSigner} />
      <div style={{ marginBottom: '20px' }}></div>
      {keys.length > 0 && <AccountSelector keys={keys} selectedKey={selectedKey} setSelectedKey={setSelectedKey} />}
      {selectedDidDocument != null && <DidDisplay selectedDidDocument={selectedDidDocument} />}
      {selectedDidDocument != null && (
        <CredentialIssuer
          agent={agent}
          selectedKey={selectedKey}
          setSelectedAlgorithm={setSelectedAlgorithm}
          setVerifiableCredential={setVerifiableCredential}
        />
      )}
      {verifiableCredential != null && <CredentialDisplay verifiableCredential={verifiableCredential} />}
      {verifiableCredential != null && (
        <CredentialValidator agent={agent} verifiableCredential={verifiableCredential} />
      )}
      {verifiableCredential != null && (
        <PresentationCreator
          agent={agent}
          selectedAlgorithm={selectedAlgorithm}
          selectedKey={selectedKey}
          verifiableCredential={verifiableCredential}
          setVerifiablePresentation={setVerifiablePresentation}
        />
      )}
      {verifiablePresentation != null && <PresentationDisplay verifiablePresentation={verifiablePresentation} />}
      {verifiablePresentation != null && (
        <PresentationValidator agent={agent} verifiablePresentation={verifiablePresentation} />
      )}
      <div style={{ marginBottom: '20px' }}></div>
      <button onClick={handleChangeOwner}>
        Change Owner
      </button>
      <div style={{ marginBottom: '20px' }}></div>
      <div>
        <label>
          Delegate Address:
          <input
            type="text"
            value={delegateAddress}
            onChange={(e) => setDelegateAddress(e.target.value)}
            className="form-input mt-1 block w-full"
          />
        </label>
      </div>
      <div>
        <label>
          Expiration Time (seconds):
          <input
            type="text"
            value={expirationTime}
            onChange={(e) => setExpirationTime(Number(e.target.value))}
            className="form-input mt-1 block w-full"
          />
        </label>
      </div>
      <button onClick={handleAddDelegate} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out">
        Add Delegate
      </button>
      <div style={{ marginBottom: '20px' }}></div>    </>
  );
}

export default App;
