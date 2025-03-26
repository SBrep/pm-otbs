"use client";
import React, { createContext, useState, useContext, useEffect } from "react";
import { BrowserProvider, formatUnits } from "ethers";

const SUPPORTED_NETWORKS: Record<
  string,
  { name: string; currency: string; dex: string }
> = {
  "0x1": { name: "Ethereum Mainnet", currency: "ETH", dex: "UniswapV2" },
  "0x89": { name: "Polygon", currency: "MATIC", dex: "Quickswap" },
  "0x38": {
    name: "Binance Smart Chain",
    currency: "BNB",
    dex: "PancakeSwapV2",
  },
  "0xa": { name: "Optimism", currency: "ETH", dex: "UniswapV2" },
  "0xa4b1": { name: "Arbitrum", currency: "ETH", dex: "UniswapV2" },
};

const WalletContext = createContext<any>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string>("0x1"); // По умолчанию Ethereum
  const [network, setNetwork] = useState(SUPPORTED_NETWORKS["0x1"]);
  const [isConnected, setIsConnected] = useState(false);

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

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      updateNetwork(chainId);
      fetchBalance(accounts[0]);
    } catch (error) {
      console.error("Ошибка подключения:", error);
    }
  };

  const updateNetwork = (chainId: string) => {
    setChainId(chainId);
    setNetwork(
      SUPPORTED_NETWORKS[chainId] || {
        name: "Unknown",
        currency: "Unknown",
        dex: "Unknown",
      }
    );
  };

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

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", (chainId: string) =>
        updateNetwork(chainId)
      );
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
      value={{ account, balance, isConnected, connectWallet, network }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
