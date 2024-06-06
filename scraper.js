const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const express = require("express");
require('dotenv').config({path: '.env'})
const app = express();
const port = 8082;
const input_pages = require('./input.json');

async function scrapeWebsite(input) {

    //open browser
    const browser = await puppeteer.launch({ headless: true, isLandscape: true, executablePath: process.env.EXE_PATH });
    const page = await browser.newPage();
    await page.setViewport({width: 1300, height: 800});
    await page.goto(input.url, { timeout: 240000 });

    //SPA page, wait for element to load on page
    try {
        await page.waitForSelector('a[rel="next"]', { visible: true });
    } catch (e) {
        console.log(e)
    }

    //change currency
    try {
        const currency = await page.$('#headlessui-popover-button-\\:R2l53om\\:');
        await currency.click();
        await delay(2000)
        if(input.currency.toLowerCase() == "usd"){
            const usd = await page.$('label[for="currency-gel"]');
            await usd.click();
        }else if(input.currency.toLowerCase() == "gel"){
            const gel = await page.$('label[for="currency-usd"]');
            await gel.click();
        }
        await delay(2000)
    } catch (e) {
        console.log(e)
    }

    //for pagination
    async function scrapePages() {
        let currentPage = 1;

        //until reach end
        while (currentPage <= input.endPage) {
            console.log(`Scraping page ${currentPage}`);
            try {
                await page.waitForSelector('a[rel="next"]', { visible: true });
            } catch (e) {
                console.log(e)
            }

            // Scrape data from the current page
            if (currentPage >= input.startPage && currentPage <= input.endPage) {
                try{
                    //scrape individual pages
                    await scrapeCurrentPage();
                }catch(e){
                    console.log(e)
                }
            }

            const nextPageButton = await page.$('a[rel="next"]');
            if (!nextPageButton) break;
            await nextPageButton.click();

            await delay(5000)
            currentPage++;
        }
        return Promise.resolve();
    }

    async function scrapeCurrentPage() {
        //get all sub items
        const allPages = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.outline-none.group.relative[target="_blank"]'));
            return items.map(item => {
                return item?.getAttribute('href') || "";
            })
        })
        console.log(allPages)

        //go to each page and open page to scrape
        for (let i = 0; i < allPages.length; i++) {
            const pageUrl = allPages[i]
            const newPage = await browser.newPage();
            await newPage.goto(`https://www.myhome.ge${pageUrl}`, { timeout: 240000, waitUntil: 'networkidle0' });

            //get all images
            const allImages = await newPage.evaluate(() => {
                const items = Array.from(document.querySelectorAll('.swiper-wrapper'));
                return items.map(item => {
                    let img_path = item?.querySelector('img')?.getAttribute('src') || "";
                    return img_path.replace('thumbs', 'large')
                })
            })
            console.log(allImages)

            //get other info
            let id, flatFloor, totalFloors, bedrooms, rooms, area, price, description, address = ""
            try {
                id = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.flex.justify-between.items-center.flex-wrap.lg\\:flex-nowrap > div > span:nth-child(3)', el => el.textContent);
                area = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(1) > div > span.mt-0\\.5.text-sm', el => el.textContent);
                price = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-3.hidden.lg\\:block.sticky > div > div.rounded-2xl.md\\:border.md\\:border-gray-20.p-0.md\\:p-5.bg-white > div.flex.items-center.justify-start.md\\:justify-between > div.flex.text-2xl.md\\:text-26.font-tbcx-bold.mt-\\[-5px\\].md\\:mt-0.mr-3.md\\:mr-0 > span:nth-child(1)', el => el.textContent);
                description = await newPage.$eval('#text-container > div', el => el.textContent);

            } catch (e) {
                console.log(e)
            }

            try{
                bedrooms = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(3) > div > span.mt-0\\.5.text-sm', el => el.textContent);
            } catch(e){
                console.log(e)
            }

            try {
                address = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.flex.flex-col.items-start > div:nth-child(1) > span', el => el.textContent);
            } catch(e) {
                address = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.flex.flex-col.items-start > div > span', el => el.textContent);
            }

            try{
                flatFloor = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(4) > div > span.mt-0\\.5.text-sm', el => el.textContent);
            }catch(e){
                flatFloor = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(3) > div > span.mt-0\\.5.text-sm', el => el.textContent);
            }

            try{
                totalFloors = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(4) > div > span.mt-0\\.5.text-sm', el => el.textContent);
            }catch(e){
                totalFloors = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(3) > div > span.mt-0\\.5.text-sm', el => el.textContent);
            }

            try{
                rooms = await newPage.$eval('#__next > div.pt-6.md\\:pt-8.pb-8.md\\:pb-12.bg-white.md\\:bg-\\[rgb\\(251\\,251\\,251\\)\\] > div > div.grid.grid-cols-12.items-start.gap-5.mt-3 > div.col-span-12.lg\\:col-span-9 > div.px-4.md\\:px-6.lg\\:px-0 > div.mt-5.md\\:border.md\\:border-gray-20.rounded-2xl.px-0.md\\:px-6.pt-0.md\\:pt-5.pb-4.md\\:pb-6.bg-white > div.hidden.md\\:block > div > div:nth-child(2) > div > span.mt-0\\.5.text-sm', el => el.textContent);
            }catch(e){
                console.log(e)
            }

            id = id?.replace("ID: ", "")
            const unitData = {
                id, flatFloor, totalFloors, bedrooms, rooms, area, price, description, address
            }

            console.log(unitData)

            //create/write info
            await createFolder(`output/${unitData.id}`)
            for (let i = 0; i < allImages.length; i++) {
                let img = allImages[i]
                if (img) {
                    await downloadImage(img, `image-${i}`, `output/${unitData.id}`)
                }
            }
            await writeInfo(`output/${unitData.id}/info.txt`, JSON.stringify(unitData))
            //close the page
            await newPage.close()
        }
        return Promise.resolve();
    }

    await scrapePages();
    await browser.close();
    return Promise.resolve();
}

//pass input url and pages
async function main(input) {
    for (let i = 0; i < input.length; i++) {
        const page = input[i]
        await scrapeWebsite(page)
    }
    return Promise.resolve();
}

//delay in seconds
function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

//create folder
async function createFolder(downloadFolder) {
    try {
        if (!fs.existsSync(downloadFolder)) {
            fs.mkdirSync(downloadFolder);
        }
    } catch (err) {
        console.error('Error creating download folder:', err);
        process.exit(1); // Exit with an error code
    }
}

//download image into the folder
async function downloadImage(imageUrl, filename, downloadFolder) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(`${downloadFolder}/${filename}`);
        const request = https.get(imageUrl, (response) => {
            response.pipe(fileStream);
            fileStream.on('finish', () => resolve(console.log(`Downloaded ${filename}`)));
            fileStream.on('error', (err) => {
                reject(err);
                console.error(`Error downloading ${filename}:`, err);
            });
        });
        request.on('error', reject);
    });
}

//write into into file
async function writeInfo(file, info){
    try {
        await fs.promises.writeFile(file, info);
        console.log(`Text data written to file: ${file}`);
    } catch (err) {
        console.error('Error writing file:', err);
    }
    return Promise.resolve();
}

//front end point to init process
app.get("/run", async function (req, res) {
    console.log("Process Started!")
    await main(input_pages)
    res.json({
        res: "Process Done",
    });
});

//run application on port
app.listen(port, async () => {
    console.log(`Server running on port http://localhost:${port}`);
});

// main()