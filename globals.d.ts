import { Eip1193Provider } from "ethers";

interface ExtendedEthereum extends Eip1193Provider {
  on: (event: string, callback: (chainId: string) => void) => void;
  removeListener: (event: string, callback: (chainId: string) => void) => void;
}

declare global {
  interface Window {
    ethereum: ExtendedEthereum;
  }
}
