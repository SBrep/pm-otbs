"use client";
import React, { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseUnits, formatUnits } from "ethers";
import { useWallet } from "../context/WalletContext"; // Контекст кошелька
import UNISWAP_ROUTER_ABI from "../abi/uniswap_router.json";

// Адреса DEX для разных сетей и протоколов
const DEX_ADDRESSES: Record<string, Record<string, string>> = {
  "Ethereum Mainnet": {
    "Uniswap V2": "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 на Ethereum
    "PancakeSwap V2": "0xEfF92A263d31888d860bD50809A8D171709b7b1c",
    // Можно добавить другие протоколы для Ethereum
  },
  "Binance Smart Chain": {
    "PancakeSwap V2": "0x10ED43C718714eb63d5aA57B78B54704E256024E", // PancakeSwap на Binance Smart Chain
    // Можно добавить другие протоколы для BSC
  },
  Polygon: {
    Quickswap: "0xa5E0829Ca887180C81B2CFeA44515a81C965dE98", // Quickswap на Polygon
    // Можно добавить другие протоколы для Polygon
  },
};

// API URL для разных сетей
const COINGECKO_API: Record<string, string> = {
  "Ethereum Mainnet":
    "https://api.coingecko.com/api/v3/coins/ethereum/contract/",
  "Binance Smart Chain":
    "https://api.coingecko.com/api/v3/coins/binance-smart-chain/contract/",
  Polygon: "https://api.coingecko.com/api/v3/coins/polygon/contract/",
};

// Валюты для разных сетей
const NETWORK_CURRENCIES: Record<string, string> = {
  "Ethereum Mainnet": "ETH",
  "Binance Smart Chain": "BNB",
  Polygon: "MATIC",
};

export default function TokenSwap() {
  const { network, account, setNetwork } = useWallet(); // Получаем данные о сети и аккаунте
  const [tokenAddress, setTokenAddress] = useState(""); // Адрес токена
  const [amount, setAmount] = useState("0.01"); // Количество ETH
  const [estimatedTokens, setEstimatedTokens] = useState("0"); // Ожидаемое количество токенов
  const [loading, setLoading] = useState(false); // Статус загрузки
  const [tokenInfo, setTokenInfo] = useState<{
    name: string;
    logo: string;
    decimals: number;
  } | null>(null); // Информация о токене (добавляем decimals)
  const [selectedProtocol, setSelectedProtocol] = useState("Uniswap V2"); // Протокол для обмена
  const [sliderValue, setSliderValue] = useState(2); // Проскальзывание

  // Подписка на изменение сети
  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      const newNetwork = getNetworkNameByChainId(chainId);
      setNetwork(newNetwork);
    };

    if (window.ethereum) {
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [setNetwork]);

  // Получение названия сети по chainId
  const getNetworkNameByChainId = (chainId: string) => {
    switch (chainId) {
      case "0x1":
        return "Ethereum Mainnet";
      case "0x38":
        return "Binance Smart Chain";
      case "0x89":
        return "Polygon";
      default:
        return "Unknown Network";
    }
  };

  // Обновление выбранного протокола при смене сети
  useEffect(() => {
    if (!network.name || !DEX_ADDRESSES[network.name]) return;

    // Устанавливаем первый доступный протокол по умолчанию
    const availableProtocols = Object.keys(DEX_ADDRESSES[network.name]);
    setSelectedProtocol(availableProtocols[0]);
  }, [network]);

  // Функция для получения информации о токене
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchTokenInfo = async (address: string) => {
    const apiUrl = COINGECKO_API[network.name];
    if (!apiUrl) {
      console.error(`Нет API для сети ${network.name}`);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}${address}`);
      if (!response.ok) throw new Error("Ошибка загрузки данных о токене");
      const data = await response.json();
      const decimals = await getTokenDecimals(address);
      setTokenInfo({
        name: data.name,
        logo: data.image.large,
        decimals, // Сохраняем количество десятичных знаков
      });
    } catch (error) {
      console.error("Ошибка получения информации о токене:", error);
      setTokenInfo(null);
    }
  };

  // Получение количества десятичных знаков токена
  const getTokenDecimals = async (address: string) => {
    try {
      const provider = new BrowserProvider(window.ethereum);
      const tokenContract = new Contract(
        address,
        ["function decimals() view returns (uint8)"],
        provider
      );
      const decimals = await tokenContract.decimals();
      return decimals;
    } catch (error) {
      console.error("Ошибка получения decimals для токена:", error);
      return 18; // По умолчанию возвращает 18
    }
  };

  // Функция для получения оценки токенов
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getEstimatedTokens = async () => {
    if (!window.ethereum || !tokenAddress) return;
    try {
      const provider = new BrowserProvider(window.ethereum);
      const routerAddress = DEX_ADDRESSES[network.name][selectedProtocol];
      if (!routerAddress) {
        console.error(
          "Не найден адрес контракта для сети и протокола",
          network.name,
          selectedProtocol
        );
        return;
      }

      const router = new Contract(routerAddress, UNISWAP_ROUTER_ABI, provider);
      const WETH = await router.WETH();
      const path = [WETH, tokenAddress];
      const amountsOut = await router.getAmountsOut(
        parseUnits(amount, 18),
        path
      );

      if (tokenInfo) {
        // Преобразование значения в корректный формат с учётом decimals
        const formattedAmount = formatUnits(amountsOut[1], tokenInfo.decimals);
        setEstimatedTokens(formattedAmount);
      }
    } catch (error) {
      console.error("Ошибка расчета цены:", error);
      setEstimatedTokens("Ошибка");
    }
  };

  // Обмен токенов
  const swapTokens = async () => {
    if (!window.ethereum) {
      alert("Пожалуйста, подключите кошелек.");
      return;
    }
    if (!account) {
      alert("Ваш кошелек не подключен. Пожалуйста, подключитесь.");
      return;
    }
    if (!tokenAddress) {
      alert("Введите корректный адрес токена!");
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const routerAddress = DEX_ADDRESSES[network.name][selectedProtocol];
      if (!routerAddress) {
        alert("Не найден адрес контракта для сети " + network.name);
        setLoading(false);
        return;
      }

      const router = new Contract(routerAddress, UNISWAP_ROUTER_ABI, signer);
      const WETH = await router.WETH();
      const path = [WETH, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

      const tx = await router.swapExactETHForTokens(
        0,
        path,
        await signer.getAddress(),
        deadline,
        {
          value: parseUnits(amount, 18),
        }
      );

      await tx.wait();
      alert("Обмен завершен!");
    } catch (error) {
      console.error("Ошибка при обмене:", error);
      setLoading(false);
    }
  };

  // Эффект для обновления информации о токене и получения оценки
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenInfo(tokenAddress);
      getEstimatedTokens();
    }

    const interval = setInterval(() => {
      if (tokenAddress) {
        fetchTokenInfo(tokenAddress);
        getEstimatedTokens();
      }
    }, 15000); // обновление каждую секунду

    // Очищаем интервал при размонтировании компонента
    return () => {
      clearInterval(interval);
    };
  }, [
    tokenAddress,
    amount,
    network,
    selectedProtocol,
    fetchTokenInfo,
    getEstimatedTokens,
  ]);

  return (
    <div className="p-6 bg-neutral-100 rounded-xl shadow-md flex flex-col gap-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-indigo-600">
        Обмен токенов ({network.name})
      </h2>

      <div className="flex flex-col gap-4">
        <label className="block">
          Введите адрес токена:
          <input
            type="text"
            className="mt-2 p-3 border rounded-xl w-full"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder="0x..."
          />
        </label>

        <label className="block">
          Количество {NETWORK_CURRENCIES[network.name] || "ETH"}:
          <input
            type="number"
            className="mt-2 p-3 border rounded-xl w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>

        <label className="block">
          Выберите протокол:
          <select
            className="mt-2 p-3 border rounded-xl w-full"
            value={selectedProtocol}
            onChange={(e) => setSelectedProtocol(e.target.value)}
          >
            {Object.keys(DEX_ADDRESSES[network.name] || {}).map((protocol) => (
              <option key={protocol} value={protocol}>
                {protocol}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <input
            type="range"
            min="0"
            max="15"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            className="w-full mt-2"
          />
          <div className="text-center">Проскальзывание {sliderValue}%</div>
        </label>
      </div>

      <div className="flex items-center gap-4 mt-4 min-h-[60px]">
        {tokenInfo && (
          <>
            <img
              src={tokenInfo.logo}
              alt={tokenInfo.name}
              className="w-12 h-12 rounded-full border"
            />
            <div className="flex flex-col justify-center">
              <p className="text-lg font-semibold">{tokenInfo.name}</p>
              <p className="text-sm text-gray-500">
                Вы получите:{" "}
                <span className="font-bold">{estimatedTokens}</span>{" "}
                {tokenInfo.name}
              </p>
            </div>
          </>
        )}
      </div>

      <button
        className="bg-indigo-500 text-white p-3 rounded-xl hover:bg-indigo-600 mt-6"
        onClick={swapTokens}
        disabled={loading}
      >
        {loading ? "Обмен..." : "Обменять"}
      </button>
    </div>
  );
}
