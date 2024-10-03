import { useAppKitProvider } from '@reown/appkit/react';
import { sepolia } from '@reown/appkit/networks';
import { BrowserProvider, Eip1193Provider } from 'ethers';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';

const WalletConnection = ({ setKms, setKeys }) => {
  const { walletProvider } = useAppKitProvider(sepolia.chainNamespace);

  const connectWallet = async () => {
    try {
      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      const web3Kms = new Web3KeyManagementSystem({ eip1193: provider });
      setKms(web3Kms);
      const listedKeys = await web3Kms.listKeys();
      setKeys(listedKeys);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  return (
    <>
      <w3m-button />
      <button onClick={connectWallet}>Connect Wallet</button>
    </>
  );
};

export default WalletConnection;