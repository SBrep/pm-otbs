import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConnectWalletButton from "@/app/components/ConnectWalletButton";

// Мокаем контекст кошелька
jest.mock("@/app/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

import { useWallet } from "@/app/context/WalletContext";

describe("ConnectWalletButton", () => {
  const mockConnectWallet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('отображает кнопку "Подключить кошелек" когда не подключен', () => {
    // Настраиваем мок для неподключенного состояния
    (useWallet as jest.Mock).mockReturnValue({
      account: null,
      balance: null,
      connectWallet: mockConnectWallet,
      network: { name: "Ethereum Mainnet", currency: "ETH" },
    });

    render(<ConnectWalletButton />);

    // Проверяем текст кнопки
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Подключить кошелек");

    // Проверяем, что информация о кошельке не отображается
    expect(screen.queryByText("Сеть:")).not.toBeInTheDocument();
    expect(screen.queryByText("Баланс:")).not.toBeInTheDocument();
  });

  test("отображает информацию о подключенном кошельке", () => {
    // Настраиваем мок для подключенного состояния
    (useWallet as jest.Mock).mockReturnValue({
      account: "0x1234567890123456789012345678901234567890",
      balance: "1.5",
      connectWallet: mockConnectWallet,
      network: { name: "Ethereum Mainnet", currency: "ETH" },
    });

    render(<ConnectWalletButton />);

    // Проверяем текст кнопки
    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("Connected: 0x1234...");

    // Проверяем наличие информации о сети и балансе
    expect(screen.getByText("Сеть: Ethereum Mainnet")).toBeInTheDocument();
    expect(screen.getByText("Баланс: 1.5 ETH")).toBeInTheDocument();
  });

  test("вызывает функцию connectWallet при нажатии на кнопку", () => {
    // Настраиваем мок
    (useWallet as jest.Mock).mockReturnValue({
      account: null,
      balance: null,
      connectWallet: mockConnectWallet,
      network: { name: "Ethereum Mainnet", currency: "ETH" },
    });

    render(<ConnectWalletButton />);

    // Кликаем по кнопке
    fireEvent.click(screen.getByRole("button"));

    // Проверяем, что функция была вызвана
    expect(mockConnectWallet).toHaveBeenCalledTimes(1);
  });
});
