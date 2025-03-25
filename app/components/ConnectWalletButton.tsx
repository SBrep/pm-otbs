"use client";
import React, { useState, useEffect } from "react";
import { BrowserProvider } from "ethers";

const SUPPORTED_NETWORKS: Record<string, { name: string; currency: string }> = {
  "0x1": { name: "Ethereum Mainnet", currency: "ETH" },
  "0x89": { name: "Polygon", currency: "MATIC" },
  "0x38": { name: "Binance Smart Chain", currency: "BNB" },
  "0xa": { name: "Optimism", currency: "ETH" },
  "0xa4b1": { name: "Arbitrum", currency: "ETH" },
};

function ConnectWalletButton() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string>("ETH");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.ethereum) {
      (window.ethereum as any).on("chainChanged", (chainId: string) => {
        updateNetwork(chainId);
      });

      (window.ethereum as any).on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance(null);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask не установлен!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      updateNetwork(chainId);
      setAccount(accounts[0]);
      fetchBalance(accounts[0]);
    } catch (error) {
      console.error("Ошибка подключения:", error);
    }
  };

  const updateNetwork = (chainId: string) => {
    if (SUPPORTED_NETWORKS[chainId]) {
      setNetwork(SUPPORTED_NETWORKS[chainId].name);
      setCurrency(SUPPORTED_NETWORKS[chainId].currency);
      setError(null);
    } else {
      setNetwork(null);
      setCurrency("Unknown");
      setError("Сеть не поддерживается");
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balanceWei = await provider.getBalance(address);
      const balanceEth = Number(balanceWei) / 1e18;
      setBalance(balanceEth.toFixed(4));
    } catch (error) {
      console.error("Ошибка получения баланса:", error);
    }
  };

  return (
    <div className="relative">
      <button
        className="text-sm bg-indigo-400 rounded-xl pt-2 p-3 pb-2"
        onClick={connectWallet}
      >
        {account
          ? `Connected: ${account.slice(0, 6)}...`
          : "Подключить кошелек"}
      </button>
      {account && (
        <div className="absolute mt-2 bg-white p-3 rounded-lg shadow-md">
          <p>Сеть: {network || "Неизвестно"}</p>
          <p>
            Баланс: {balance} {currency}
          </p>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default ConnectWalletButton;
