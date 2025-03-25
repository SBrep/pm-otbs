import ConnectWalletButton from "./ConnectWalletButton";

export default function Header() {
  return (
    <header className="grid grid-cols-3 items-center tracking-wide font-bold p-5">
      <div className="flex justify-start">
        <p>PM-OTBS</p>
      </div>
      <div className="flex justify-center">
        <p>Token Swap</p>
      </div>
      <div className="flex justify-end">
        <ConnectWalletButton />
      </div>
    </header>
  );
}
