//const PORT = process.env.PORT || 8000;


import express from 'express'
export const app = express();

import cors from 'cors';

import { fetchNewsPuppeteer, closeBrowser } from '../utils/fetchNewsPuppeteer.js'
import { dataInfobae, dataPagina12, dataClarin, dataAmbito, dataPerfil } from '../dataSites.js'

app.use(cors());

// app.METHOD(PATH, HANDLER);

app.get("/", function (req, res) {
	res.json("This is my webscraper with node");
});

app.get("/api/data", async (req, res) => {
	const container = [];

	try {
		const sitesToScrape = [dataInfobae, dataPagina12, dataClarin, dataAmbito, dataPerfil];

		// Limitar la concurrencia de las promesas
		const chunkSize = 2;
		for (let i = 0; i < sitesToScrape.length; i += chunkSize) {
			const chunk = sitesToScrape.slice(i, i + chunkSize);
			const results = await Promise.all(chunk.map(site => fetchNewsPuppeteer(site).catch(err => ({ error: err.message }))));
			results.forEach((result, index) => {
				console.log(`Procesando resultado ${index}:`, result);
				if (!result.error) {
					container.push(result);
				} else {
					console.error(`Error en la promesa ${index}:`, result.error);
				}
			});
		}
		console.log(container)
		res.json(container);
	} catch (error) {
		console.error("Error al obtener datos:", error);
		res.status(500).json({ error: "Error al obtener datos" });
	}
});

process.on('SIGINT', async () => {
	await closeBrowser();
	process.exit();
});


//app.listen(PORT, () => {
//	console.log(`Servidor corriendo en http://localhost:${PORT}`);
//});

export default app;
