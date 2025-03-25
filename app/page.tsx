"use client";
import React from "react";
import Header from "./components/Header";
import TokenSwap from "./components/TokenSwap";
import { WalletProvider } from "./components/WalletContext";

export default function Home() {
  return (
    <WalletProvider>
      <div className="min-h-screen flex flex-col">
        <main>
          <Header />
          <TokenSwap />
        </main>
      </div>
    </WalletProvider>
  );
}
