
import subSchema from '../../../models/subscription.js'
import puppeteer from 'puppeteer'

export async function getScriptTags (orgID, url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto(url)
  let scriptTags = await page.$$eval('script', scripts => scripts.map(script => script.textContent)
    .filter(scriptText => scriptText.match(/function asyncLoad()/g) && scriptText.match(/url/g)))
  await browser.close()
  // eslint-disable-next-line array-callback-return
  scriptTags = scriptTags.map(scriptText => {
    const lines = scriptText.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('var urls = [')) {
        // console.log("ping")
        return lines[i].trim()
      }
    }
  })
  scriptTags = scriptTags.toString()
  const urls = []
  const result = []
  scriptTags = scriptTags.split(',')
  scriptTags.forEach(i => {
    urls.push(i.split('\\'))
  })
  for (let i = 0; i < urls.length; i++) {
    const saasData = {
      name: urls[i][2].replace('/', ''),
      ssoID: null,
      emsID: null,
      emps: [],
      licences: null,
      currentCost: null,
      amountSaved: null,
      dueDate: null
    }
    result.push(saasData)
  }
  console.log(result)
  await browser.close()
  const filter = { ID: orgID }
  // const update = { apps: result }
  // await subSchema.findOneAndUpdate(filter, update)
  console.log('App discovery data updated successfully')
}
