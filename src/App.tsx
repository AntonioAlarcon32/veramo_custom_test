import { useCallback, useEffect, useState } from 'react'
import { BrowserProvider } from 'ethers';
import { MetaMaskInpageProvider } from "@metamask/providers";
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { KeyManager } from '@veramo/key-manager';
import { ManagedKeyInfo, IDIDManager, IResolver, createAgent, ICredentialPlugin, IDataStore, IKeyManager, TAgent, VerifiableCredential, VerifiablePresentation } from '@veramo/core';
import { DIDManager, MemoryDIDStore } from '@veramo/did-manager';
import { MemoryKeyStore } from '@veramo/key-manager';
import { EthrDIDProvider } from '@veramo/did-provider-ethr';
import { DIDResolverPlugin } from '@veramo/did-resolver';
import { getResolver as getEthrDidResolver } from "ethr-did-resolver";
import { Resolver } from 'did-resolver';
import { CredentialPlugin } from '@veramo/credential-w3c';
import { CredentialProviderJWT } from '@veramo/credential-jwt';
import Dropdown from './Dropdown';
import { CredentialProviderEIP712 } from '@veramo/credential-eip712';
import { Buffer } from 'buffer';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
    Buffer: typeof Buffer;
  }
}

window.Buffer = Buffer;

type ConfiguredAgent = TAgent<IDIDManager & IResolver & ICredentialPlugin & IDataStore & IKeyManager>;

function App() {

  const [kms, setKms] = useState<Web3KeyManagementSystem | null>(null);
  const [keys, setKeys] = useState<ManagedKeyInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<ManagedKeyInfo | null>(null);
  const [agent, setAgent] = useState<ConfiguredAgent | null>(null);
  const [inputSubject, setInputSubject] = useState('');
  const [selectedDid, setSelectedDid] = useState<string | null>(null);
  const [verifiableCredential, setVerifiableCredential] = useState<VerifiableCredential | null>(null);
  const [signatureType, setSignatureType] = useState<string>('');
  const [credentialValidated, setCredentialValidated] = useState<string>("");
  const [verifiablePresentation, setVerifiablePresentation] = useState<VerifiablePresentation | null>(null);
  const [presentationValidated, setPresentationValidated] = useState<string>("");
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
          issuers: [new CredentialProviderJWT(), new CredentialProviderEIP712()]
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
    if (selectedKey) {
      getDidDocument();
    }
  }, [selectedKey]);

  async function handleAccountSelection(key: ManagedKeyInfo) {
    setSelectedKey(key);

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
      proofFormat: signatureType,
    });
    console.log("Credential created")
    setVerifiableCredential(credential);
  }

  async function validateCredential() {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    if (!verifiableCredential) {
      throw new Error('No credential selected');
    }

    const result = await agent.verifyCredential({
      credential: verifiableCredential,
    });
    console.log("Credential validated");
    if (result.verified === true) {
      setCredentialValidated("Credential is valid")
    } else {
      setCredentialValidated("Credential is not valid")
    }
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputSubject(event.target.value);
  };

  const options = [
    { value: 'EthTypedDataSignature', label: 'EthTypedDataSignature' },
    { value: 'EthereumEip712Signature2021', label: 'EthereumEip712Signature2021' }
  ]

  const handleDropdownSelect = (option: { value: string; label: string }) => {
    console.log('Selected option:', option);
    setSignatureType(option.value);
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

  async function createVerifiablePresentation() {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    if (!selectedKey) {
      throw new Error('No key selected');
    }

    if (!inputSubject) {
      throw new Error('No input subject');
    }

    if (!verifiableCredential) {
      throw new Error('No verifiable credential');
    }
    const did = `did:ethr:sepolia:${selectedKey.meta?.account.address}`;
    const presentation = await agent.createVerifiablePresentation({
      presentation: {
        holder: did,
        verifiableCredential: [verifiableCredential],
      },
      proofFormat: signatureType,
    });
    console.log("Presentation created");
    setVerifiablePresentation(presentation);
  }

  async function validatePresentation() {
    if (!agent) {
      throw new Error('Agent not initialized');
    }

    if (!verifiablePresentation) {
      throw new Error('No presentation selected');
    }

    const result = await agent.verifyPresentation({
      presentation: verifiablePresentation,
    });
    console.log("Presentation validated: ", result);
    if (result.verified === true) {
      setPresentationValidated("Presentation is valid")
    } else {
      setPresentationValidated("Presentation is not valid")
    }
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
      <Dropdown
        options={options}
        onSelect={handleDropdownSelect}
        placeholder="Choose signature type"
      />
      <button onClick={issueCredential}>Issue Credential</button>
      <div style={{ marginBottom: '20px' }}></div>
    </div>
    <h3>Created Verifiable Credential</h3>
    <div><pre>{<p>{JSON.stringify(verifiableCredential, null, 4)}</p>}</pre></div>

    <button onClick={validateCredential}>Validate Credential</button>
    <div style={{ marginBottom: '20px' }}></div>
    <h3>Credential validation result</h3>
    <div>{<h4>{credentialValidated}</h4>}</div>
    <div style={{ marginBottom: '20px' }}></div>
    <button onClick={createVerifiablePresentation}>Create Presentation</button>
    <h3>Created Verifiable Presentation</h3>
    <div><pre>{<p>{JSON.stringify(verifiablePresentation, null, 4)}</p>}</pre></div>
    <button onClick={validatePresentation}>Validate Presentation</button>
    <h3>Presentation validation result</h3>
    <div>{<h4>{presentationValidated}</h4>}</div>
    <div style={{ marginBottom: '20px' }}></div>
  </>

}

export default App;