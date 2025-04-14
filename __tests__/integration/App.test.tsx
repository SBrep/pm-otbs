import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import Home from "@/app/page";
import { WalletProvider } from "@/app/context/WalletContext";

describe("Интеграционный тест приложения", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.ethereum = {
      request: jest.fn().mockImplementation((params) => {
        if (params.method === "eth_requestAccounts") {
          return Promise.resolve([
            "0x1234567890123456789012345678901234567890",
          ]);
        }
        if (params.method === "eth_chainId") {
          return Promise.resolve("0x1");
        }
        return Promise.resolve({});
      }),
      on: jest.fn(),
      removeListener: jest.fn(),
    };
  });

  // Существующие тесты остаются без изменений
  test("отображает основной UI и позволяет подключить кошелек", async () => {
    render(
      <WalletProvider>
        <Home />
      </WalletProvider>
    );
    expect(screen.getByText("PM-OTBS")).toBeInTheDocument();
    expect(screen.getByText("Token Swap")).toBeInTheDocument();
    expect(screen.getByText("Подключить кошелек")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("Подключить кошелек"));
    });
    await waitFor(() => {
      expect(screen.getByText(/Connected: 0x1234.../)).toBeInTheDocument();
    });
  });

  test("отображает форму обмена токенов и обрабатывает ввод", async () => {
    render(
      <WalletProvider>
        <Home />
      </WalletProvider>
    );
    expect(screen.getByText(/Обмен токенов/)).toBeInTheDocument();
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Количество ETH:/i), {
        target: { value: "0.5" },
      });
    });
    expect(screen.getByPlaceholderText("0x...").getAttribute("value")).toBe(
      "0xTokenAddress"
    );
    expect(
      screen.getByLabelText(/Количество ETH:/i).getAttribute("value")
    ).toBe("0.5");
  });

  test("показывает ошибку при попытке обмена без ввода адреса токена", async () => {
    window.alert = jest.fn();
    render(
      <WalletProvider>
        <Home />
      </WalletProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Подключить кошелек"));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });
    expect(window.alert).toHaveBeenCalledWith(
      "Введите корректный адрес токена!"
    );
  });

  test("обрабатывает отсутствие MetaMask при попытке обмена", async () => {
    window.alert = jest.fn();
    delete window.ethereum;
    render(
      <WalletProvider>
        <Home />
      </WalletProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });
    expect(window.alert).toHaveBeenCalledWith(
      "Пожалуйста, подключите кошелек."
    );
  });

  test("выполняет обмен токенов с подключенным кошельком", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ name: "Test Token" }),
    });
    render(
      <WalletProvider>
        <Home />
      </WalletProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Подключить кошелек"));
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
      fireEvent.change(screen.getByLabelText(/Количество ETH:/i), {
        target: { value: "0.1" },
      });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  test("обрабатывает ошибку API при загрузке информации о токене", async () => {
    console.error = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("API Error")),
    });
    render(
      <WalletProvider>
        <Home />
      </WalletProvider>
    );
    await act(async () => {
      fireEvent.click(screen.getByText("Подключить кошелек"));
    });
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xBadTokenAddress" },
      });
    });
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
      expect(screen.getByText(/Обмен токенов/)).toBeInTheDocument();
    });
  });
});
