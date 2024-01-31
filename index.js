const express = require('express');
const app = express();
const cors = require('cors');
const puppeteer = require('puppeteer');
const port = 3000;

app.use(cors());

app.get('/scrap', async (req, res) => {
    try {
        // Launch the browser and open a new blank page
        const browser = await puppeteer.launch({ headless: true });

        // Store the scraped data from all pages
        const allScrapedData = [];

        // Iterate through the first three pages
        for (let pageId = 1; pageId <= 3; pageId++) {
            // Navigate the page to a URL
            const page = await browser.newPage();
            await page.goto(`https://news.ycombinator.com/?p=${pageId}`);

            // Use page.evaluate to run JavaScript code in the context of the page
            const data = await page.evaluate(() => {
                const items = document.querySelectorAll('.athing');
                const subtextElements = document.querySelectorAll('.subtext');

                const scrapedData = [];

                items.forEach((item, index) => {
                    const titleElement = item.querySelector('.titleline a');
                    const voteLinkElement = item.querySelector('.sitebit a');
                    const scoreElement = subtextElements[index].querySelector('.score');
                    const userElement = subtextElements[index].querySelector('.hnuser');
                    const ageElement = subtextElements[index].querySelector('.age');

                    // Check if elements exist before accessing their properties
                    const title = titleElement ? titleElement.textContent.trim() : 'N/A'
                    const url = titleElement ? titleElement.getAttribute('href') : 'N/A';
                    const hackerNewsUrl = voteLinkElement ? voteLinkElement.getAttribute('href') : 'N/A';
                    const upvotes = scoreElement ? scoreElement.textContent.trim() : 'N/A';
                    const postedBy = userElement ? userElement.textContent.trim() : 'N/A';
                    const postedOn = ageElement ? ageElement.getAttribute('title') : 'N/A';

                    scrapedData.push({ url, hackerNewsUrl, upvotes, postedBy, postedOn, title });
                });

                return scrapedData;
            });

            // Close the current page
            await page.close();

            // Append the scraped data from the current page to the overall data
            allScrapedData.push(...data);
        }

        // Convert the postedOn strings to Date objects for sorting
        const sortedData = allScrapedData.sort((a, b) =>
            new Date(b.postedOn) - new Date(a.postedOn)
        );

        // Close the browser
        await browser.close();

        // Send the sorted data as the response

        res.json(sortedData);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => console.log(`Example app listening on port ${process.env.port || port}!`));
