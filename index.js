#!/usr/bin/env node
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');
const download = require('image-downloader');

// config
const base = 'https://www.dytt8.net/';
const outputBase = 'fetch/';
const date = new Date();
const today = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
const MOVIES_JSON = path.join(outputBase, 'movies.json');
const TODAY_JSON = path.join(outputBase, `${today}.json`);
const DB1_JSON = path.join(outputBase, `db1.json`);

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 900,
        deviceScaleFactor: 1,
    });

    await page.goto(base, { waitUntil: 'domcontentloaded' });
    const movies = []
    let links = [], part1, part2
    // selector
    part1 = await page.$eval('#header > div > div.bd2 > div.bd3 > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(2) > div.co_content8 > ul > table', e => e.outerHTML);
    part2 = await page.$eval('#header > div > div.bd2 > div.bd3 > div:nth-child(2) > div:nth-child(1) > div > div:nth-child(3) > div.co_content8 > ul > table', e => e.outerHTML);
    links = links.concat(getLinks(part1))
    links = links.concat(getLinks(part2))

    for (let i = 0; i < links.length; i++) {
        const linkStr = links[i]
        const name = getLinkName(linkStr)
        const href = getLinkHref(linkStr)
        if (name && href) {
            movies.push({ name, href })
        }
    }

    for (let i = 0; i < movies.length; i++) {
        console.log(`fetch movie`, movies[i].name)
        const m = movies[i]
        const { src, d, meta } = await crawlLinkPage(m, page)
        m.imgSrc = src // image
        m.d = d // download links
        m.meta = meta
    }

    await browser.close();
    
    const db = initDB()
    const news = movies.filter(m => !db.find(m.name))

    db.update(news, `${today}.json`)
    fs.writeFileSync(TODAY_JSON, JSON.stringify(news))
    
    fs.copySync(DB1_JSON, 'web/public/db1.json')
    fs.copySync(TODAY_JSON, `web/public/${today}.json`)
    
    fs.writeFileSync(MOVIES_JSON, JSON.stringify(movies))
    fs.copySync(MOVIES_JSON, 'web/public/movies.json')
})();

function initDB() {
    // init
    if (!fs.existsSync(DB1_JSON)) { fs.writeFileSync(DB1_JSON, '[]') }
    const str = fs.readFileSync(DB1_JSON)
    const instance = JSON.parse(str)

    const find = function (name) {
        return instance.find(i => i.k.indexOf(name) >= 0) ? true : false
    }
    const update = function (movies = [], filename) {
        const k = movies.filter(m => !find(m.name)).map(m => m.name)
        if (k.length > 0) {
            instance.push({
                k: k.join('‖'), // keywords
                f: filename
            })
            fs.writeFileSync(DB1_JSON, JSON.stringify(instance))
        }
    }
    return { find, update }
}

function getLinks(htmlStr) {
    const match = htmlStr.match(/<a\s+href="[^<]+\d\.html[^<]+<\/a>/g) // a link
    return match ? match : []
}

function getLinkName(linkStr) {
    const match = linkStr.match(/>[^<]+</)
    return match ? match[0].substring(1, match[0].length - 1) : ''
}

function getLinkHref(linkStr) {
    const match = linkStr.match(/\/.+\.html/)
    return match ? path.join(base, match[0]) : ''
}

// selector
async function crawlLinkPage(m, page) {
    await page.goto(m.href, { waitUntil: 'domcontentloaded' })
    await page.waitFor(1000);
    const imgStr = await page.$eval('#Zoom img', e => e.outerHTML)
    const url = imgStr.match(/https:.*\.jpg/)
    const src = url ? url[0] : ''
    // let src = ''
    // if (url) {
    //     const options = {
    //         url: url[0],
    //         dest: path.join(outputBase, 'images'),
    //         timeout: 5000
    //     }
    //     try {
    //         const { filename, image } = await download.image(options)
    //         console.log('Saved to', src = filename.replace(outputBase, ''))
    //     } catch (err) {
    //         console.error(err)
    //     }
    // }

    const htmlStr = await page.$eval('#Zoom', e => e.outerHTML)
    const ftps = htmlStr.match(/>ftp:[^<]+</g)
    const d = []
    if (ftps) {
        ftps.forEach(m => {
            // console.log(`h`, m)
            d.push(m.substring(1, m.length - 1))
        })
    }

    const meta = {}
    find(htmlStr, /◎[^<]+/g).forEach(item => {
        const extractLabel = (propName, tag) => {
            if (item.indexOf(tag) === 0) {
                meta[propName] = item.replace(tag, '').trim()
            }
        }
        extractLabel('t-name', '◎译　　名')
        extractLabel('name', '◎片　　名')
        extractLabel('year', '◎年　　代')
        extractLabel('country', '◎产　　地')
        extractLabel('language', '◎语　　言')
        extractLabel('liryc', '◎字　　幕')
        extractLabel('date', '◎上映日期')
        extractLabel('imdb', '◎IMDb评分')
        extractLabel('douban', '◎豆瓣评分')
        extractLabel('director', '◎导　　演')
        extractLabel('leading', '◎主　　演')
        extractLabel('label', '◎标　　签')
        extractLabel('category', '◎类　　别')
    })

    find(htmlStr, /◎简　　介\s*<br><br>([^<]+<br>)+<br>/).forEach(item => {
        meta['summary'] = item.replace('◎简　　介', '').replace(/<br>/g, '').trim()
    })

    find(htmlStr, /◎获奖情况\s*<br><br>([^<]+<br>)+<br>/).forEach(item => {
        meta['awards'] = item.replace('◎获奖情况', '').replace(/<br>/g, '').trim()
    })

    return { src, d, meta }
}

function find(str, regex) {
    const match = str.match(regex)
    return match ? match : []
}
