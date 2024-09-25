import { createAgent, IDIDManager, IResolver, ICredentialPlugin } from '@veramo/core'
import { KeyManager } from '@veramo/key-manager'
import { DIDManager } from '@veramo/did-manager'
import { DIDResolverPlugin } from '@veramo/did-resolver'
import { CredentialPlugin } from '@veramo/credential-w3c'
import { CredentialProviderJWT } from '@veramo/credential-jwt'
import { Web3KeyManagementSystem } from '@veramo/kms-web3'
import { MemoryDIDStore } from '@veramo/did-manager'
import { MemoryKeyStore } from '@veramo/key-manager'
import { EthrDIDProvider } from '@veramo/did-provider-ethr'
import { Resolver } from 'did-resolver'
import { getResolver as getEthrDidResolver } from 'ethr-did-resolver'


const didStore = new MemoryDIDStore();
const keyStore = new MemoryKeyStore();

const registries = {
    mainnet: '0xdca7ef03e98e0dc2b855be647c39abe984fcf21b',
    sepolia: '0x03d5003bf0e79c5f5223588f347eba39afbc3818'
}

export const veramoAgent = createAgent<IDIDManager & IResolver & ICredentialPlugin>({
    plugins: [
        new KeyManager({
            store: keyStore,
            kms: {
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
})