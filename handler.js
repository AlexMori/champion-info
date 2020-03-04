'use strict';

const getChromeInstance = require("./getChromeInstance");
const puppeteer = require("puppeteer-core");
const canvas = require('canvas');
const Clipper = require('image-clipper');
const fs = require('fs');

module.exports.info = async event => {

    const championName = event.queryStringParameters.championName;

    const chrome = await getChromeInstance();

    const browser = await puppeteer.connect({
        browserWSEndpoint: chrome.endpoint
    });

    const page = await browser.newPage();

    await page.setViewport({
        width: 1150,
        height: 1700,
        deviceScaleFactor: 1
    });

    await page.goto(`https://u.gg/lol/champions/${championName}/build`, {
        waitUntil: ["domcontentloaded", "networkidle2"]
    });

    await page.addScriptTag({path: 'page-handler.js'});

    const header = await page.$('.champion-profile-page');
    const rect = await header.boundingBox();

    await page.screenshot({path: 'out.png'});

    Clipper.configure('canvas', canvas);

    Clipper('out.png', function() {
        this.crop(rect.x, rect.y, rect.width, rect.height)
            .quality(80)
            .toFile(`${championName}.jpg`, function() {
                console.log('saved!');
            });
    });

    const imageUrl = 'data:image/jpeg;base64,' + fs.readFileSync(`${championName}.jpg`, { encoding: 'base64' });

    await browser.close();

    return {
        statusCode: 200,
        body: imageUrl
    };
};
