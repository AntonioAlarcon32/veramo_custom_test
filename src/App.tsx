import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers';
import { MetaMaskInpageProvider } from "@metamask/providers";
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { KeyManager } from '@veramo/key-manager';
import { ManagedKeyInfo, IDIDManager, IResolver, createAgent, ICredentialPlugin, IDataStore, IKeyManager, TAgent } from '@veramo/core';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { MemoryKeyStore } from '@veramo/key-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { getResolver as getEthrDidResolver } from "ethr-did-resolver";
import { Resolver } from 'did-resolver';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { CredentialProviderJWT } from '@veramo/credential-jwt';
declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
  }
}

type ConfiguredAgent = TAgent<IDIDManager & IResolver & ICredentialPlugin & IDataStore & IKeyManager>;

function App() {

  const [kms, setKms] = useState<Web3KeyManagementSystem | null>(null);
  const [keys, setKeys] = useState<ManagedKeyInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<ManagedKeyInfo | null>(null);
  const [agent, setAgent] = useState<ConfiguredAgent | null>(null);
  const [inputSubject, setInputSubject] = useState('');
  const [selectedDid, setSelectedDid] = useState<string | null>(null);

  async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new BrowserProvider(window.ethereum);
        const web3Kms = new Web3KeyManagementSystem({ metamask: provider });
        setKms(web3Kms);
        const listedKeys = await web3Kms.listKeys();
        setKeys(listedKeys);

      } catch (error) {
        console.error(error);
      }
    }
  }

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
              rpcUrl: 'https://mainnet.infura.io/v3/707f7fa6bee6474196a78bf7622503f5'
            }),
            'did:ethr:sepolia': new EthrDIDProvider({
              defaultKms: 'web3',
              registry: registries['sepolia'],
              rpcUrl: 'https://sepolia.infura.io/v3/707f7fa6bee6474196a78bf7622503f5'
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
          issuers: [new CredentialProviderJWT()]
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

  async function handleAccountSelection(key: ManagedKeyInfo) {
    setSelectedKey(key);
    getDidDocument();

    console.log("Changed account to: ", key);
  }

  async function issueCredential() {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    if (!selectedKey) {
      throw new Error('No key selected');
    }

    if (!inputSubject) {
      throw new Error('No input subject');
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
      proofFormat: 'EthTypedDataSignature',
    });
    console.log("Credential created: ", credential);
  }


  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputSubject(event.target.value);
  };

  async function getDidDocument() {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    if (!selectedKey) {
      throw new Error('No key selected');
    }

    const did = `did:ethr:sepolia:${selectedKey.meta?.account.address}`;

    const didDocument = await agent.resolveDid({ didUrl: did });
    setSelectedDid(JSON.stringify(didDocument.didDocument, null, 2));
  }

  return <>
    <button onClick={connectWallet}>Connect to MetaMask</button>
    <div style={{ marginBottom: '20px' }}></div>
    {keys.length > 0 && (
      <div>
        <h3>Select an account:</h3>
        {keys.map((key) => (
          <div key={key.kid}>
            <input
              type="radio"
              id={key.kid}
              name="account"
              value={key.kid}
              checked={selectedKey?.kid === key.kid}
              onChange={() => handleAccountSelection(key)}
            />
            <label htmlFor={key.kid}>{key.kid}</label>
          </div>
        ))}
      </div>
    )}
    <h3>Selected DID</h3>
    <div><pre>{<p>{selectedDid}</p>}</pre></div>
    <div>
      <input
        type="text"
        value={inputSubject}
        onChange={handleInputChange}
        placeholder="Enter text here"
      />
      <button onClick={issueCredential}>Issue Credential</button>
      <div style={{ marginBottom: '20px' }}></div>
      
    </div>
  </>

}

export default App;