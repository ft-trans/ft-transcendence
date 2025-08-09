import { Component } from "../component";
import { Link } from "./link";

export class Header extends Component {
	render(): string {
		return `
      <header class="bg-white shadow-sm">
        <div class="px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-4">
            <h1 class="text-2xl font-bold text-gray-900">
                <a href="/" data-link class="hover:text-blue-600">ft_trans</a>
            </h1>
            <nav class="space-x-6">
              ${new Link().render({ href: "/auth/register", text: "登録" })}
            </nav>
          </div>
        </div>
      </header>
    `;
	}
}
