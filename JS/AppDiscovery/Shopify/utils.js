
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
    let url = urls[i][2].replace('/', '').split('.')
    if (url.length > 2) {
      url = url[1]
    } else {
      url = url[0]
    }
    const saasData = {
      name: url,
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

  await browser.close()
  const filter = { ID: orgID }
  const res = await subSchema.findOne(filter)
  let apps = res.apps
  apps = apps.concat(result)
  const update = { apps: apps }
  await subSchema.findOneAndUpdate(filter, update)
  console.log('App discovery data updated successfully')
}
// 's3.amazonaws.com',
//   'staticw2.yotpo.com',
//   'shopify.privy.com',
//   'cdn.shopify.com',
//   'analytics.getshogun.com',
//   'js.smile.io',
//   'id-shop.govx.com',
//   'cdn.stilyoapps.com',
//   'www.dwin1.com',
//   'static.shareasale.com',
//   'shopifyorderlimits.s3.amazonaws.com',
//   'services.nofraud.com'
//   'cdn.shopify.com',
//   'mpop.pxucdn.com',
//   'js.smile.io',
//   'minufy.com',
//   'cdn.bitespeed.co',
//   'cdn.shopify.com',
//   'cdn.onesignal.com',
//   'cdn.onesignal.com',
//   'cdn.shopify.com',
//   'omnisnippet1.com',
//   'cdn.pushowl.com',
//   'upsellproductaddons.com',
//   'cdn.shopify.com'
