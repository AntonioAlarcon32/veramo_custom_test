import { ManagedKeyInfo } from '@veramo/core';

interface AccountSelectorProps {
  keys: ManagedKeyInfo[];
  selectedKey: ManagedKeyInfo | null;
  setSelectedKey: React.Dispatch<React.SetStateAction<ManagedKeyInfo | null>>;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ keys, selectedKey, setSelectedKey }) => {
  const handleAccountSelection = (key: ManagedKeyInfo) => {
    setSelectedKey(key);
    console.log('Changed account to: ', key);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Select an Account</h2>
      <div className="space-y-3">
        {keys.map((key) => (
          <div key={key.kid} className="flex items-center">
            <input
              type="radio"
              id={key.kid}
              name="account"
              value={key.kid}
              checked={selectedKey?.kid === key.kid}
              onChange={() => handleAccountSelection(key)}
              className="form-radio h-5 w-5 text-blue-600"
            />
            <label htmlFor={key.kid} className="ml-2 text-gray-700 hover:text-gray-900 cursor-pointer">
              {key.kid}
            </label>
          </div>
        ))}
      </div>
      {keys.length === 0 && (
        <p className="text-gray-500 italic">No accounts available. Please connect your wallet first.</p>
      )}
    </div>
  );
};

export default AccountSelector;
