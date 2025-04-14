// __tests__/context/WalletContext.additional.test.tsx
import React from "react";
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { WalletProvider, useWallet } from "@/app/context/WalletContext";

// Компонент для тестирования хука useWallet
const TestComponent = () => {
  const { account, balance, isConnected, connectWallet, network } = useWallet();

  return (
    <div>
      <div data-testid="account">{account || "no-account"}</div>
      <div data-testid="balance">{balance || "no-balance"}</div>
      <div data-testid="network-name">{network.name}</div>
      <div data-testid="is-connected">
        {isConnected ? "connected" : "not-connected"}
      </div>
      <button data-testid="connect-button" onClick={connectWallet}>
        Connect
      </button>
    </div>
  );
};

describe("WalletContext дополнительные тесты", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Настраиваем мок для window.ethereum
    window.ethereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      isMetaMask: true,
    };
  });

  test("обрабатывает случай, когда MetaMask не установлен", async () => {
    // Удаляем window.ethereum для имитации отсутствия MetaMask
    delete window.ethereum;
    global.alert = jest.fn();

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // Нажимаем кнопку подключения
    await act(async () => {
      fireEvent.click(screen.getByTestId("connect-button"));
    });

    // Проверяем, что был вызван alert
    expect(global.alert).toHaveBeenCalledWith("MetaMask не установлен!");

    // Восстанавливаем window.ethereum
    window.ethereum = {
      request: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
    };
  });

  test("обрабатывает ошибки при подключении кошелька", async () => {
    // Сохраняем оригинальную функцию и консоль.ошибку
    const originalRequest = window.ethereum.request;
    const originalConsoleError = console.error;

    // Мокируем ошибку подключения и консоль
    console.error = jest.fn();
    window.ethereum.request = jest
      .fn()
      .mockRejectedValue(new Error("Отказано в доступе"));

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // Нажимаем кнопку подключения
    await act(async () => {
      fireEvent.click(screen.getByTestId("connect-button"));
    });

    // Проверяем, что была обработана ошибка
    expect(console.error).toHaveBeenCalled();

    // Восстанавливаем оригинальные функции
    window.ethereum.request = originalRequest;
    console.error = originalConsoleError;
  });

  test("обрабатывает смену аккаунта", async () => {
    // Настраиваем моки
    window.ethereum.request = jest
      .fn()
      .mockResolvedValueOnce(["0x1234567890123456789012345678901234567890"]) // eth_requestAccounts
      .mockResolvedValueOnce("0x1"); // eth_chainId

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // Подключаем кошелек
    await act(async () => {
      fireEvent.click(screen.getByTestId("connect-button"));
    });

    // Проверяем, что аккаунт обновился
    await waitFor(() => {
      expect(screen.getByTestId("account")).toHaveTextContent(
        "0x1234567890123456789012345678901234567890"
      );
    });

    // Симулируем событие смены аккаунта
    await act(async () => {
      // Получаем обработчик события accountsChanged
      const accountsChangedHandler = window.ethereum.on.mock.calls.find(
        (call) => call[0] === "accountsChanged"
      )[1];

      // Вызываем обработчик с новым аккаунтом
      accountsChangedHandler(["0xABCDEF1234567890ABCDEF1234567890ABCDEF12"]);
    });

    // Проверяем, что аккаунт обновился
    expect(screen.getByTestId("account")).toHaveTextContent(
      "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"
    );
  });

  test("обрабатывает отключение аккаунта", async () => {
    // Настраиваем моки
    window.ethereum.request = jest
      .fn()
      .mockResolvedValueOnce(["0x1234567890123456789012345678901234567890"]) // eth_requestAccounts
      .mockResolvedValueOnce("0x1"); // eth_chainId

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // Подключаем кошелек
    await act(async () => {
      fireEvent.click(screen.getByTestId("connect-button"));
    });

    // Симулируем событие отключения аккаунтов
    await act(async () => {
      // Получаем обработчик события accountsChanged
      const accountsChangedHandler = window.ethereum.on.mock.calls.find(
        (call) => call[0] === "accountsChanged"
      )[1];

      // Вызываем обработчик с пустым массивом (отключение)
      accountsChangedHandler([]);
    });

    // Проверяем, что аккаунт сбросился
    expect(screen.getByTestId("account")).toHaveTextContent("no-account");
    expect(screen.getByTestId("is-connected")).toHaveTextContent(
      "not-connected"
    );
  });

  test("обрабатывает ошибку при получении баланса", async () => {
    // Настраиваем моки
    window.ethereum.request = jest
      .fn()
      .mockResolvedValueOnce(["0x1234567890123456789012345678901234567890"]) // eth_requestAccounts
      .mockResolvedValueOnce("0x1"); // eth_chainId

    // Мок getBalance чтобы вызвать ошибку
    const ethersModule = require("ethers");
    ethersModule.BrowserProvider.mockImplementation(() => {
      return {
        getBalance: jest.fn().mockRejectedValue(new Error("Balance Error")),
        getSigner: jest.fn().mockResolvedValue({
          getAddress: jest
            .fn()
            .mockResolvedValue("0x1234567890123456789012345678901234567890"),
        }),
        send: jest.fn().mockImplementation((method, params) => {
          if (method === "eth_requestAccounts") {
            return Promise.resolve([
              "0x1234567890123456789012345678901234567890",
            ]);
          }
          if (method === "eth_chainId") {
            return Promise.resolve("0x1");
          }
          return Promise.resolve({});
        }),
      };
    });

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // Подключаем кошелек
    await act(async () => {
      fireEvent.click(screen.getByTestId("connect-button"));
    });

    // Проверяем, что компонент не упал и баланс не обновился
    expect(screen.getByTestId("balance")).toHaveTextContent("no-balance");
  });

  test("обрабатывает неизвестную сеть", async () => {
    // Настраиваем мок для неизвестной сети
    window.ethereum.request = jest
      .fn()
      .mockResolvedValueOnce(["0x1234567890123456789012345678901234567890"]) // eth_requestAccounts
      .mockResolvedValueOnce("0x99"); // Неизвестный chainId

    render(
      <WalletProvider>
        <TestComponent />
      </WalletProvider>
    );

    // Подключаем кошелек
    await act(async () => {
      fireEvent.click(screen.getByTestId("connect-button"));
    });

    // Проверяем, что сеть определена как неизвестная
    await waitFor(() => {
      expect(screen.getByTestId("network-name")).toHaveTextContent("Unknown");
    });
  });
});
