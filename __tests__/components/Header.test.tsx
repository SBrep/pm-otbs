import React from "react";
import { render, screen } from "@testing-library/react";
import Header from "@/app/components/Header";

// Мокаем компонент кнопки подключения кошелька
jest.mock("@/app/components/ConnectWalletButton", () => {
  return function MockConnectWalletButton() {
    return <div data-testid="wallet-button">Mock Wallet Button</div>;
  };
});

describe("Header", () => {
  test("отображает заголовок и включает компонент кнопки кошелька", () => {
    render(<Header />);

    // Проверяем, что заголовок отображается правильно
    expect(screen.getByText("PM-OTBS")).toBeInTheDocument();
    expect(screen.getByText("Token Swap")).toBeInTheDocument();

    // Проверяем, что кнопка кошелька включена в компонент
    expect(screen.getByTestId("wallet-button")).toBeInTheDocument();
  });
});
