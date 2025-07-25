import viteLogo from "/vite.svg";
import { setupCounter } from "./counter.ts";
import typescriptLogo from "./typescript.svg";

// biome-ignore lint/style/noNonNullAssertion: app は必ず存在する
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1 class="text-3xl font-bold underline">
      Hello world!
    </h1>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

// biome-ignore lint/style/noNonNullAssertion: button は必ず存在する
setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
