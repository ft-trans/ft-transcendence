// biome-ignore lint/style/noNonNullAssertion: app は必ず存在する
document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1 class="text-3xl font-bold underline">
      Hello world!
    </h1>
  </div>
`;
