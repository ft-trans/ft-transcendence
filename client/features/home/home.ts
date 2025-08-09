import { Component, Header } from "client/components";

export class Home extends Component {
	render(): string {
		return `
      <div class="min-h-screen">
          ${new Header().render()}
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="text-center mb-12">
              <h2 class="text-4xl font-bold text-gray-900 mb-4">Welcome to Simple SPA</h2>
              <p class="text-xl text-gray-600 mb-8">A TypeScript-based single page application framework</p>
            </div>
          </main>
      </div>
    `;
	}
}
