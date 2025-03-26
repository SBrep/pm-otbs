"use client";
import React from "react";
import { useWallet } from "../context/WalletContext";

function ConnectWalletButton() {
  const { account, balance, connectWallet, network } = useWallet();

  return (
    <div className="relative">
      <button
        className="text-sm bg-indigo-400 rounded-xl p-3"
        onClick={connectWallet}
      >
        {account
          ? `Connected: ${account.slice(0, 6)}...`
          : "Подключить кошелек"}
      </button>
      {account && (
        <div className="absolute mt-2 bg-white p-3 rounded-lg shadow-md">
          <p>Сеть: {network.name}</p>
          <p>
            Баланс: {balance} {network.currency}
          </p>
        </div>
      )}
    </div>
  );
}

export default ConnectWalletButton;
