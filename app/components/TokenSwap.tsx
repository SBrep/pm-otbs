import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserProvider, Contract, parseUnits, formatUnits } from "ethers";
import UNISWAP_ROUTER_ABI from "../abi/uniswap_router.json"; // ABI для Router Uniswap

const UNISWAP_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"; // Адрес Uniswap V2 Router

export default function TokenSwap() {
  const [tokenAddress, setTokenAddress] = useState(""); // Адрес токена
  const [amount, setAmount] = useState("0.01"); // Количество ETH
  const [estimatedTokens, setEstimatedTokens] = useState("0"); // Количество получаемых токенов
  const [loading, setLoading] = useState(false);
  const [tokenName, setTokenName] = useState(""); // Название токена
  const [tokenImage, setTokenImage] = useState(""); // URL изображения токена

  // Вызовем эту функцию при изменении адреса токена или суммы
  useEffect(() => {
    if (tokenAddress) {
      getEstimatedTokens();
      getTokenInfo(); // Получаем информацию о токене (название и изображение)
    }
  }, [tokenAddress, amount]);

  // Функция для получения названия токена и изображения через Coingecko API
  const getTokenInfo = async () => {
    if (!tokenAddress) return;

    try {
      // API URL для получения данных о токене по адресу
      const url = `https://api.coingecko.com/api/v3/coins/ethereum/contract/${tokenAddress}`;
      const response = await axios.get(url);

      const tokenData = response.data;
      setTokenName(tokenData.name); // Название токена
      setTokenImage(tokenData.image.thumb); // Изображение токена
    } catch (error) {
      console.error("Ошибка получения информации о токене:", error);
      setTokenName("Не удалось получить название");
      setTokenImage("");
    }
  };

  const getEstimatedTokens = async () => {
    if (!window.ethereum || !tokenAddress) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const router = new Contract(
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_ROUTER_ABI,
        provider
      );
      const WETH = await router.WETH();
      const path = [WETH, tokenAddress];
      const amountsOut = await router.getAmountsOut(
        parseUnits(amount, 18),
        path
      );
      setEstimatedTokens(formatUnits(amountsOut[1], 18));
    } catch (error) {
      console.error("Ошибка расчета цены:", error);
      setEstimatedTokens("Ошибка");
    }
  };

  const swapTokens = async () => {
    if (!window.ethereum || !tokenAddress) {
      alert("Введите корректный адрес токена!");
      return;
    }

    setLoading(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const router = new Contract(
        UNISWAP_ROUTER_ADDRESS,
        UNISWAP_ROUTER_ABI,
        signer
      );

      const WETH = await router.WETH();
      const path = [WETH, tokenAddress];
      const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 минут

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
    }
    setLoading(false);
  };

  return (
    <div className="p-6 bg-neutral-100 rounded-xl shadow-md flex flex-col gap-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-center text-indigo-600">
        Обмен токенов
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
          Количество ETH:
          <input
            type="number"
            className="mt-2 p-3 border rounded-xl w-full"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-4 mt-4 min-h-[60px]">
        {tokenImage && (
          <img
            src={tokenImage}
            alt={tokenName}
            className="w-12 h-12 rounded-full border"
          />
        )}
        <div className="flex flex-col justify-center">
          <p className="text-lg font-semibold">
            {tokenName || "Токен не найден"}
          </p>
          <p className="text-sm text-gray-500">
            Вы получите: <span className="font-bold">{estimatedTokens}</span>{" "}
            {tokenName || "токенов"}
          </p>
        </div>
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
