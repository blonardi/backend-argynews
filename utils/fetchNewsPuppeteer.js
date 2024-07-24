//import puppeteer from 'puppeteer';
let chrome = {}
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
	chrome = await import('@sparticuz/chromium')
	puppeteer = await import('puppeteer-core')
} else {
	puppeteer = await import('puppeteer')
}

let browser;
let pagePool = [];
const MAX_POOL_SIZE = 5; // Ajusta este número según tus necesidades




async function initBrowser() {

	let options = {};
	if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
		options = {
			args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
			defaultViewport: chrome.defaultViewport,
			executablePath: await chrome.executablePath,
			headless: true,
			ignoreHTTPSErrors: true,
		};
	}
	if (!browser) {
		browser = await puppeteer.launch(options);
	}
	return browser;
}

async function getPage() {
	if (pagePool.length > 0) {
		return pagePool.pop();
	}
	const browser = await initBrowser();
	return browser.newPage();
}

async function releasePage(page) {
	if (pagePool.length < MAX_POOL_SIZE) {
		await page.goto('about:blank'); // Limpia la página
		pagePool.push(page);
	} else {
		await page.close();
	}
}

export async function fetchNewsPuppeteer(siteData) {
	const { name, imageSite, clase1, clase2, clase3, imgClase, href, urlClase, urlSite } = siteData;
	const limit = 8;
	let page;
	try {
		page = await getPage();
		await page.goto(urlSite, { timeout: 30000, waitUntil: 'domcontentloaded' });

		// Esperar a que se carguen los elementos
		const selector = clase1 || 'article';
		await page.waitForSelector(selector, { timeout: 10000 });

		// Esperar a que se carguen las imágenes
		await page.waitForSelector(imgClase, { timeout: 10000 });

		// Extraer datos de la página con Puppeteer
		const articles = await page.$$eval(selector, (elements, params) => {
			const { clase3, imgClase, href, urlClase, limit } = params;
			const filteredArticles = [];
			let count = 0;

			for (const element of elements) {
				if (count >= limit) break; // Salir del bucle si ya alcanzamos el límite

				const imageSrc = element.querySelector(imgClase)?.getAttribute('src');
				const image = imageSrc ? imageSrc.split(' ')[0] : ''; // Dividir la imagen por un espacio y obtener la primera posición
				const title = element.querySelector(clase3)?.textContent.trim();
				const url = element.querySelector(urlClase)?.getAttribute(href);

				if (image && title && url) {
					filteredArticles.push({ title, url, image });
					count++; // Incrementar el contador de artículos válidos
				}
			}

			return filteredArticles;
		}, { clase3, imgClase, href, urlClase, limit });

		// Procesar los artículos obtenidos
		return { name, imageSite, urlSite, firstArticles: articles };
	} catch (err) {
		console.error("Error al cargar la página:", err);
		throw err;
	} finally {
		if (page) {
			await releasePage(page);
		}
	}
}

export async function closeBrowser() {
	if (browser) {
		await Promise.all(pagePool.map(page => page.close()));
		await browser.close();
		browser = null;
		pagePool = [];
	}
}
