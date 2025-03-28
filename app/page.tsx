"use client";
import React from "react";
import Header from "./components/Header";
import TokenSwap from "./components/TokenSwap";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <main>
        <Header />
        <TokenSwap />
      </main>
    </div>
  );
}
