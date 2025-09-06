type BannerType = "info" | "warning" | "error";

const bannerStyles: { [key in BannerType]: string } = {
	info: "bg-sky-500",
	warning: "bg-amber-500",
	error: "bg-red-600",
};

type Props = {
	message: string;
	type: BannerType;
};

export class FloatingBanner {
	private readonly elem: HTMLDivElement;
	private readonly type: BannerType;
	private static readonly duration = 4000;

	constructor({ message, type }: Props) {
		this.elem = document.createElement("div");
		this.type = type;

		this.elem.className = `fixed top-5 left-1/2 w-full max-w-xl p-4 rounded-md shadow-lg text-white z-50
                         transition-all duration-500 ease-out transform -translate-x-1/2 -translate-y-full opacity-0
                         ${bannerStyles[type]} flex items-center justify-between space-x-4`;
		this.elem.innerHTML = `
      <span>${message}</span>
      <button class="ml-4 text-white hover:text-gray-200 focus:outline-none banner-close">
        <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-x"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
      </button>
    `;
		this.show();

		const closeButton = this.elem.querySelector(".banner-close");
		if (closeButton) {
			closeButton.addEventListener("click", () => {
				this.destroy();
			});
		}
	}

	show() {
		document.body.appendChild(this.elem);

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.elem.classList.remove("-translate-y-full", "opacity-0");
				this.elem.classList.add("translate-y-0", "opacity-100");
			});
		});

		if (this.type === "info") {
			setTimeout(() => {
				this.destroy();
			}, FloatingBanner.duration);
		}
	}

	destroy() {
		this.elem.classList.remove("translate-y-0", "opacity-100");
		this.elem.classList.add("-translate-y-full", "opacity-0");

		this.elem.addEventListener(
			"transitionend",
			() => {
				this.elem.remove();
			},
			{ once: true },
		);
	}
}
