import { useAppKit, useAppKitAccount, useAppKitProvider, useWalletInfo } from '@reown/appkit/react';
import { sepolia } from '@reown/appkit/networks';
import { BrowserProvider } from 'ethers';
import { Web3KeyManagementSystem } from '@veramo/kms-web3';
import { ManagedKeyInfo } from '@veramo/core';
import { useEffect, useState, useCallback } from 'react';
import { Eip1193Provider } from 'ethers';
import { Signer } from 'ethers';

interface WalletConnectionProps {
  setKms: React.Dispatch<React.SetStateAction<Web3KeyManagementSystem | null>>;
  setKeys: React.Dispatch<React.SetStateAction<ManagedKeyInfo[]>>;
  setBrowserProvider: React.Dispatch<React.SetStateAction<BrowserProvider | null>>;
  setSigner: React.Dispatch<React.SetStateAction<Signer | null>>;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({ setKms, setKeys, setBrowserProvider, setSigner }) => {
  const { walletProvider } = useAppKitProvider(sepolia.chainNamespace);

  const { open } = useAppKit();
  const { walletInfo } = useWalletInfo();
  const { address, status, isConnected } = useAppKitAccount();
  const [isKmsCreated, setIsKmsCreated] = useState<boolean>(false);

  const openWalletConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const connectWallet = useCallback(async () => {
    try {
      console.log('Wallet Info: ', walletInfo);
      console.log('Account: ', address);
      console.log('Status: ', status);
      console.log('Connected: ', isConnected);

      const provider = new BrowserProvider(walletProvider as Eip1193Provider);
      setBrowserProvider(provider);
      const signer = provider.getSigner();
      setSigner(await signer);
      const web3Kms = new Web3KeyManagementSystem({ eip1193: provider });
      setKms(web3Kms);
      const listedKeys = await web3Kms.listKeys();
      setKeys(listedKeys);
      setIsKmsCreated(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  }, [walletProvider, setKms, setKeys, isConnected, walletInfo, address, status, setBrowserProvider, setSigner]);

  useEffect(() => {
    if (isConnected && !isKmsCreated) {
      connectWallet();
      console.log('Connected wallet: ', walletInfo);
    }
  }, [isConnected, isKmsCreated, walletInfo, connectWallet]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Connect Your Wallet</h2>
      <div className="flex flex-col sm:flex-row justify-between items-center">
        <button
          onClick={openWalletConnect}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out"
        >
          Connect Wallet
        </button>
      </div>
    </div>
  );
};

export default WalletConnection;
