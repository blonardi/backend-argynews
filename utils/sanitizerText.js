export function sanitizerText(texto) {
	// asercion, va a empezar o finalizar con x cosa
	console.log({texto})
	const sanitiziedText = texto.replace(/\t+/g, " ").trim();
	return sanitiziedText;
}