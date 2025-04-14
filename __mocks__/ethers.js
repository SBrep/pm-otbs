// __mocks__/ethers.js (обновленный)
const ethersOriginal = jest.requireActual("ethers");

// Мок для signer
const mockSigner = {
  getAddress: jest
    .fn()
    .mockResolvedValue("0x1234567890123456789012345678901234567890"),
};

// Мок для контрактов
const mockContract = {
  WETH: jest
    .fn()
    .mockResolvedValue("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"),
  name: jest.fn().mockResolvedValue("Test Token"),
  symbol: jest.fn().mockResolvedValue("TEST"),
  decimals: jest.fn().mockResolvedValue(18),
  getAmountsOut: jest
    .fn()
    .mockResolvedValue([
      ethersOriginal.parseUnits("0.01", 18),
      ethersOriginal.parseUnits("100", 18),
    ]),
  swapExactETHForTokens: jest.fn().mockResolvedValue({
    wait: jest.fn().mockResolvedValue({}),
  }),
};

// Мок для провайдера с дополнительной возможностью управления ошибками
let shouldFailGetBalance = false;

const mockProvider = {
  getBalance: jest.fn().mockImplementation(() => {
    if (shouldFailGetBalance) {
      return Promise.reject(new Error("Failed to get balance"));
    }
    return Promise.resolve(ethersOriginal.parseUnits("1.5", 18));
  }),
  getSigner: jest.fn().mockResolvedValue(mockSigner),
  send: jest.fn().mockImplementation((method, params) => {
    if (method === "eth_requestAccounts") {
      return Promise.resolve(["0x1234567890123456789012345678901234567890"]);
    }
    if (method === "eth_chainId") {
      return Promise.resolve("0x1");
    }
    return Promise.resolve({});
  }),
};

// Экспортируем расширенные моки
module.exports = {
  ...ethersOriginal,
  BrowserProvider: jest.fn().mockImplementation(() => mockProvider),
  Contract: jest.fn().mockImplementation(() => mockContract),
  parseUnits: ethersOriginal.parseUnits,
  formatUnits: ethersOriginal.formatUnits,
  // Добавляем возможность имитировать ошибки для тестов
  _setMockConfig: {
    setShouldFailGetBalance: (value) => {
      shouldFailGetBalance = value;
    },
  },
};
