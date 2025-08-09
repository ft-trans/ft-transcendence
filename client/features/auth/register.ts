import { Button } from "client/components/button";
import { Component } from "client/components/component";
import { FormInput } from "client/components/form_input";
import { Header } from "client/components/header";

export class Register extends Component {
	render(): string {
		return `
      <div class="min-h-screen">
        ${new Header().render()}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="text-center mt-10 mb-6">
            <h2 class="text-4xl font-bold text-gray-900 mb-4">アカウントを作成</h2>
          </div>
          <div class="max-w-md mx-auto">
            <form id="register-form" class="space-y-6">
              ${new FormInput().render({
								id: "email",
								name: "email",
								type: "email",
								autocomplete: "email",
								labelText: "メールアドレス",
							})}
              <div class="flex justify-center">
                ${new Button().render({
									width: "full",
									type: "submit",
									text: "登録",
								})}
              </div>
            </form>
          </div>
        </main>
      </div>
    `;
	}
}
