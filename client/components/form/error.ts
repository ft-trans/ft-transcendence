import z from "zod";

export const annotateError = ({
	fieldId,
	message,
}: {
	fieldId: string;
	message: string;
}): void => {
	const elem = document.getElementById(fieldId);
	if (elem) {
		// 既存のエラー表示を削除
		const existingErrors =
			elem.parentElement?.querySelectorAll(".error-annotation");
		if (existingErrors) {
			existingErrors.forEach((errorElem) => errorElem.remove());
		}

		// エラーを注釈
		const errorElement = document.createElement("div");
		errorElement.className = "text-red-500 text-sm mt-1 error-annotation";
		errorElement.textContent = message;
		elem.parentElement?.appendChild(errorElement);

		// 要素に赤枠を追加
		elem.classList.add("border-red-500", "focus:border-red-500");
	}
};

export const annotateZodErrors = <T>(error: z.ZodError<T>) => {
	const flattened = z.flattenError(error);
	Object.entries(flattened.fieldErrors).forEach(([fieldId, message]) => {
		if (Array.isArray(message)) {
			annotateError({
				fieldId,
				message: message.join("\n"),
			});
		}
	});
};
