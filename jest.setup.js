import "@testing-library/jest-dom";

// Мокаем window.ethereum
global.window.ethereum = {
  request: jest.fn(),
  on: jest.fn(),
  removeListener: jest.fn(),
  send: jest.fn(),
  isMetaMask: true,
};

// Мокаем глобальный fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        image: { large: "https://example.com/token.png" },
      }),
  })
);

// Мокаем localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});

// Мокаем fetch API
global.fetch = jest.fn();

// Мокаем window.alert
global.alert = jest.fn();

// Присваиваем определенный ID процесса для избежания ошибок с криптомодулями
process.env.JEST_WORKER_ID = "1";
