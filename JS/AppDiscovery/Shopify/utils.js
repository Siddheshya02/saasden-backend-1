
import appDiscoverySchema from '../../../models/appDiscovery.js'
import puppeteer from 'puppeteer'
export async function getScriptTags (orgID, url, names) {
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
  let app = {}
  scriptTags = scriptTags.split(',')
  scriptTags.forEach(i => {
    urls.push(i.split('\\'))
  })
  for (let i = 0; i < urls.length; i++) {
    let dat = urls[i][2].replace('/', '').split('.')
    if (dat.length > 2) {
      dat = dat[1]
    } else {
      dat = dat[0]
    }
    let found = false
    for (let i = 0; i < result.length; i++) {
      // eslint-disable-next-line eqeqeq
      if (result[i].name == dat) {
        found = true
        break
      }
    }
    if (found) {
      continue
    }
    app = {
      name: dat
    }
    result.push(app)
  }
  const disc = {
    discName: names,
    url: url,
    apps: result
  }
  await browser.close()
  const filter = { ID: orgID }
  // const res = await appDiscoverySchema.findOne(filter)
  // let discovery = res.discovery.apps
  // discovery = discovery.concat(result)
  const update = { discovery: disc }
  await appDiscoverySchema.findOneAndUpdate(filter, update)
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
