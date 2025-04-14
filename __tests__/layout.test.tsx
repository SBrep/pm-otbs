// app/__tests__/layout.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

describe("RootLayout", () => {
  test("рендерит дочерние компоненты и устанавливает HTML-структуру", () => {
    const testContent = "Test Child";
    render(
      <RootLayout>
        <div>{testContent}</div>
      </RootLayout>
    );

    // Проверяем дочерний контент
    expect(screen.getByText(testContent)).toBeInTheDocument();

    // Проверяем HTML-структуру
    expect(document.documentElement.lang).toBe("en");
  });
});
