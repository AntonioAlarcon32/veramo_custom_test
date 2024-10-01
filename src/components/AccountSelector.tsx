import React from 'react';

const AccountSelector = ({ keys, selectedKey, setSelectedKey }) => {
  const handleAccountSelection = (key) => {
    setSelectedKey(key);
    console.log("Changed account to: ", key);
  };

  return (
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
  );
};

export default AccountSelector;