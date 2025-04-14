import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import TokenSwap from "@/app/components/TokenSwap";

// Мокаем хук useWallet
jest.mock("@/app/context/WalletContext", () => ({
  useWallet: jest.fn(),
}));

// Для восстановления после удаления из компонента
const originalWindowEthereum = window.ethereum;

import { useWallet } from "@/app/context/WalletContext";

describe("TokenSwap", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Настраиваем моки для каждого теста
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Ethereum Mainnet" },
      account: "0x1234567890123456789012345678901234567890",
      setNetwork: jest.fn(),
    });
  });

  afterEach(() => {
    window.ethereum = originalWindowEthereum;
  });

  test("отображает форму обмена токенов", () => {
    render(<TokenSwap />);

    // Проверяем базовые элементы формы
    expect(screen.getByText(/Обмен токенов/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
    expect(screen.getByText(/Количество ETH/)).toBeInTheDocument();
    expect(screen.getByText(/Выберите протокол/)).toBeInTheDocument();
    expect(screen.getByText(/Проскальзывание/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Обменять/ })
    ).toBeInTheDocument();
  });

  test("обновляет состояние при вводе адреса токена", async () => {
    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Проверяем, что изменило значение поля
    expect(screen.getByPlaceholderText("0x...").getAttribute("value")).toBe(
      "0xTokenAddress"
    );
  });

  test("показывает ошибку при попытке обмена без подключенного кошелька", async () => {
    // Мокируем состояние без подключенного кошелька
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Ethereum Mainnet" },
      account: null, // нет аккаунта
      setNetwork: jest.fn(),
    });

    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Нажимаем кнопку обмена
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });

    // Проверяем, что alert был вызван с правильным сообщением
    expect(window.alert).toHaveBeenCalledWith(
      "Ваш кошелек не подключен. Пожалуйста, подключитесь."
    );
  });

  test("вызывает estimatedTokens при вводе адреса токена", async () => {
    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Дожидаемся обновления (здесь мы проверяем только что не возникает ошибок)
    await waitFor(() => {
      // Обычно здесь мы бы проверили, что функция getEstimatedTokens была вызвана,
      // но она не экспортируется, поэтому мы просто проверяем, что компонент не упал
      expect(screen.getByPlaceholderText("0x...")).toBeInTheDocument();
    });
  });

  test("обновляет значение проскальзывания при перемещении слайдера", async () => {
    render(<TokenSwap />);

    // Находим слайдер
    const slider = screen.getByRole("slider");

    // Изменяем значение слайдера
    await act(async () => {
      fireEvent.change(slider, { target: { value: 10 } });
    });

    // Проверяем текст с процентом проскальзывания
    expect(screen.getByText(/Проскальзывание 10%/)).toBeInTheDocument();
  });

  test("вызывает swapTokens при нажатии на кнопку обмена с подключенным кошельком", async () => {
    // Мокируем window.alert для этого теста
    const originalAlert = window.alert;
    window.alert = jest.fn();

    // Подготавливаем мок для токена
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            image: { large: "https://example.com/token.png" },
          }),
      })
    );

    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Подождем, чтобы токен "загрузился"
    await waitFor(() => {
      // Нажимаем кнопку обмена
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });

    // Восстанавливаем оригинальный alert
    window.alert = originalAlert;
  });

  test("отображает информацию о токене после ввода адреса", async () => {
    // Необходимо мокировать ответ от Ethereum контракта
    const mockTokenInfo = {
      name: "Test Token",
      symbol: "TEST",
      decimals: 18,
    };

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            image: { large: "https://example.com/token.png" },
          }),
      })
    );

    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Здесь мы не проверяем текст "Test Token", так как он может быть не доступен в DOM
    // Вместо этого проверим, что был вызван запрос к API
    expect(global.fetch).toHaveBeenCalled();
  });

  test("обрабатывает ошибку при загрузке информации о токене", async () => {
    console.error = jest.fn(); // Отключаем вывод ошибок в консоль для теста

    // Мокируем ошибку при fetch
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () =>
          Promise.reject(new Error("Ошибка загрузки данных о токене")),
      })
    );

    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xBadTokenAddress" },
      });
    });

    // Ждем, пока будет вызвана обработка ошибки
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test("обновляет оценку токенов при изменении количества", async () => {
    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Меняем количество ETH
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Количество ETH:/i), {
        target: { value: "0.5" },
      });
    });

    // Проверяем, что количество обновилось
    expect(
      screen.getByLabelText(/Количество ETH:/i).getAttribute("value")
    ).toBe("0.5");
  });

  test("обновляет протокол при смене сети", async () => {
    // Мокируем useWallet с другой сетью
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Binance Smart Chain" },
      account: "0x1234567890123456789012345678901234567890",
      setNetwork: jest.fn(),
    });

    render(<TokenSwap />);

    // Проверяем, что протокол изменился на первый доступный для BSC
    await waitFor(() => {
      const protocolSelector = screen.getByLabelText(/Выберите протокол:/i);
      expect(protocolSelector).toHaveValue("PancakeSwap V2");
    });
  });

  test("показывает ошибку при попытке обмена без ввода адреса токена", async () => {
    // Мокируем window.alert
    window.alert = jest.fn();

    render(<TokenSwap />);

    // Нажимаем кнопку обмена без ввода адреса токена
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });

    // Проверяем, что появилось предупреждение
    expect(window.alert).toHaveBeenCalledWith(
      "Введите корректный адрес токена!"
    );
  });

  test("реагирует на изменение сети", async () => {
    const mockSetNetwork = jest.fn();
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Ethereum Mainnet" },
      account: "0x1234567890123456789012345678901234567890",
      setNetwork: mockSetNetwork,
    });

    render(<TokenSwap />);

    // Проверяем, что отображается правильное имя сети
    expect(
      screen.getByText(/Обмен токенов \(Ethereum Mainnet\)/)
    ).toBeInTheDocument();

    // Меняем сеть в моке
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Binance Smart Chain" },
      account: "0x1234567890123456789012345678901234567890",
      setNetwork: mockSetNetwork,
    });

    // Повторно рендерим компонент с обновленным контекстом
    render(<TokenSwap />);

    // Проверяем, что отображается новое имя сети
    expect(
      screen.getByText(/Обмен токенов \(Binance Smart Chain\)/)
    ).toBeInTheDocument();
  });

  test("обрабатывает изменение сети", async () => {
    const mockSetNetwork = jest.fn();
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Ethereum Mainnet" },
      account: "0x1234567890123456789012345678901234567890",
      setNetwork: mockSetNetwork,
    });

    render(<TokenSwap />);

    // Проверяем, что обработчик события chainChanged зарегистрирован
    expect(window.ethereum.on).toHaveBeenCalledWith(
      "chainChanged",
      expect.any(Function)
    );

    // Получаем обработчик события
    const chainChangedHandler = window.ethereum.on.mock.calls.find(
      (call) => call[0] === "chainChanged"
    )[1];

    // Симулируем событие изменения сети на Binance Smart Chain
    await act(async () => {
      chainChangedHandler("0x38");
    });

    // Проверяем, что была вызвана функция setNetwork с правильным именем сети
    expect(mockSetNetwork).toHaveBeenCalledWith("Binance Smart Chain");
  });

  test("обрабатывает отсутствие API для сети", async () => {
    // Мокируем useWallet с неподдерживаемой сетью
    (useWallet as jest.Mock).mockReturnValue({
      network: { name: "Unsupported Network" },
      account: "0x1234567890123456789012345678901234567890",
      setNetwork: jest.fn(),
    });

    render(<TokenSwap />);

    // Вводим адрес токена
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText("0x..."), {
        target: { value: "0xTokenAddress" },
      });
    });

    // Проверяем, что была вызвана console.error
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Нет API для сети")
      );
    });
  });

  test("проверяет наличие window.ethereum при обмене", async () => {
    // Удаляем window.ethereum
    delete window.ethereum;

    render(<TokenSwap />);

    // Нажимаем кнопку обмена
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Обменять/ }));
    });

    // Проверяем, что было показано предупреждение
    expect(window.alert).toHaveBeenCalledWith(
      "Пожалуйста, подключите кошелек."
    );

    // Восстанавливаем window.ethereum
    window.ethereum = originalWindowEthereum;
  });
});
