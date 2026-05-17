// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { App } from "./App";

describe("App smoke", () => {
  it("renders without throwing", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".app")).not.toBeNull();
  });
});
