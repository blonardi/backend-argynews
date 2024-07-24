import { sanitizerText } from './sanitizerText.js';
import axios from 'axios';
import cheerio from 'cheerio';


export async function solicitudURL(siteData, res, container) {
	const limit = 8;
	const {
			name,
			imageSite,
			clase1,
			clase2,
			clase3,
			imgClase,
			href,
			urlClase,
			urlSite,
	} = siteData;
	try {
			await axios(urlSite).then((response) => {
					const html = response.data;
					const $ = cheerio.load(html);
					const articles = [];

					$(clase1, html).each(function () {
							const image = $(this).find(imgClase).attr("src");
							const divCard = $(this).find(clase2);
							const titleReceived =
									divCard.find(clase3).text() || $(this).find(clase3).text();
							const title = sanitizerText(titleReceived);
							const url = $(this).find(urlClase).attr(href);
							divCard.attr(href) ||
									$(this).attr(href) ||
									$(this).find(clase3).attr(href);

							const isFull = articles.length === limit;
							if (isFull) {
									return;
							}

							articles.push({
									title,
									url,
									image,
							});
					});
					// const firstArticles = articles.slice(0, 8);
					const firstArticles = articles;
					const newPage = { name, imageSite, urlSite, firstArticles };

					const isInContainer = container.some((page) => page.name === name);
					if (isInContainer) {
							return;
					}

					container.push(newPage);
			});
	} catch (err) {
			console.error(err);
			res.status(500).json({
					error: "Ocurrió un error en la solicitud.",
			});
	}
}