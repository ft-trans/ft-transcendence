import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'
import { setupRegisterUser } from './user.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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
    <div class="user">
      <input id="email" type="text" placeholder="Enter your email" />
      <button id="register" type="button">send</button>
      <div id="users"></div>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!)
setupRegisterUser(document.querySelector<HTMLButtonElement>('#register')!)
