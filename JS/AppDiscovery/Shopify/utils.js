
import subSchema from '../../../models/subscription.js';
const puppeteer = require('puppeteer');

export async function getScriptTags(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    let scriptTags = await page.$$eval('script', scripts => scripts.map(script => script.textContent)
    .filter(scriptText => scriptText.match(/function asyncLoad()/g) && scriptText.match(/url/g)));
    await browser.close();
   scriptTags=  scriptTags.map(scriptText => {
    const lines = scriptText.split("\n");
    for(let i = 0; i < lines.length; i++) {
        if(lines[i].includes(`var urls = [`)){
            // console.log("ping")
            return lines[i].trim();
        }
    }
    });
    scriptTags=scriptTags.toString();
    let urls=[]
    let result=[]
    scriptTags=scriptTags.split(",")
    scriptTags.forEach(i => {
        urls.push(i.split(`\\`));
    });
    for (let i=0;i<urls.length;i++){
        result.push(urls[i][2].replace(`/`,``));
    }
    // console.log(result)
    await browser.close();
    const filter = { ID: orgID }
    const update = {apps: result}
  await subSchema.findOneAndUpdate(filter, update)
  console.log('App discovery data updated successfully')
}
