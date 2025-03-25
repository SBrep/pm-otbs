"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { BrowserProvider, formatUnits } from "ethers";

// Список поддерживаемых сетей
const supportedChains: Record<string, string> = {
  "0x1": "Ethereum Mainnet",
  "0x89": "Polygon",
  "0x38": "Binance Smart Chain",
  "0x5": "Goerli Testnet",
};

const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Функция подключения кошелька
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask не установлен!");
      return;
    }

    try {
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      setIsConnected(true);

      // Получаем текущую сеть
      const network = await provider.getNetwork();
      updateNetwork(network.chainId.toString(16)); // Преобразуем в строку hex

      fetchBalance(accounts[0]);
    } catch (error) {
      console.error("Ошибка подключения:", error);
    }
  };

  // Функция обновления сети
  const updateNetwork = (chainHex: string) => {
    setChainId(chainHex);
    setNetworkName(supportedChains[chainHex] || "Сеть не поддерживается");
  };

  // Функция получения баланса
  const fetchBalance = async (walletAddress: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const balanceInWei = await provider.getBalance(walletAddress);
      const balanceInEth = formatUnits(balanceInWei, 18);
      setBalance(parseFloat(balanceInEth).toFixed(4));
    } catch (error) {
      console.error("Ошибка получения баланса:", error);
    }
  };

  // Следим за изменением сети в MetaMask
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", (chainId: string) => {
        updateNetwork(chainId);
      });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchBalance(accounts[0]);
        } else {
          setAccount(null);
          setBalance(null);
          setIsConnected(false);
        }
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{ account, balance, isConnected, connectWallet, networkName }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
