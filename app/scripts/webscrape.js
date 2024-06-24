const fs = require('fs');
const playwright = require('playwright');
const cheerio = require('cheerio');
const { convert } = require('html-to-text');


let pages = []
let pageCount = 1

const loadPages = async (url, filter) => {
  const resultsListPlaywright = async (page) => {
    const results = []
    const titles = page.locator('p[class="govuk-body-l govuk-!-margin-bottom-1"]')
    const summaries = page.locator('p[class="govuk-body-s govuk-!-margin-bottom-2"]')
    const links = page.locator('a[class="govuk-link filter-results-link"]')

    for (let i = 0; i < await titles.count(); i++) {
      const title = await titles.nth(i).evaluate(el => el.textContent)
      const summary = await summaries.nth(i).evaluate(el => el.textContent)
      const href = await links.nth(i).evaluate(el => el.getAttribute('href'))

      //const details = await loadPage(`${url}${href.substring(1)}`)

      results.push({
        title,
        summary,
        href
      })
    }

    return results
  }

  const resultsListCheerio = async ($) => {
    const results = []
    const titles = $('p[class="govuk-body-l govuk-!-margin-bottom-1"]').map((i, el) => {
      return $(el).text().trim()
    }).toArray()

    const summaries = $('p[class="govuk-body-s govuk-!-margin-bottom-2"]').map((i, el) => {
      return $(el).text().trim()
    }).toArray()

    const links = $('a[class="govuk-link filter-results-link"]').map((i, el) => {
      return $(el).attr('href').trim()
    }).toArray()

    await Promise.all(titles.map(async (x, i) => {
      const project = {
        id: titles[i].substring(0, titles[i].indexOf(' ')),
        title: titles[i],
        summary: summaries[i],
        href: `${url}${links[i].substring(1)}`
      }

      const details = await loadPage(`${url}${links[i].substring(1)}`)

      results.push({ ...project, ...details })
    }))

    return results
  }

  const browser = await playwright.chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })

  // Filter by "Evaluation" keyword
  if (filter !== '') {
    await page.locator('span[class="govuk-details__summary-text filter-bold-link"]').locator('text="Keywords"').click()
    await page.waitForSelector('#key271', { state: 'visible' })
    await page.click('#key271')
  }

  // Click search results
  const searchSelector = '.filter-search-button'
  const loadedSelector = 'main#searchResuls'
  const nextSelector = 'a[class="pagination__link govuk-link"][aria-label="Next page"]'
  await page.waitForSelector(searchSelector)
  await page.click(searchSelector)
  let finished = false

  await page.waitForSelector(loadedSelector)
  const html = await page.locator(loadedSelector).evaluate(el => el.outerHTML)
  let $ = cheerio.load(html)

  // Inspect number of results
  const titles = $('h2[class="govuk-fieldset__heading"]').map((i, el) => {
    return $(el).text().trim()
  }).toArray()
  console.log('title', titles[0])

  let results = await resultsListCheerio($)
  pages = [...pages, ...results]

  /////finished = true
  while (!finished) {
    if (await page.locator(nextSelector).count() > 0) {
      pageCount += 1
      console.log(`Page ${pageCount}`)

      await page.click(nextSelector)
      await page.waitForTimeout(3000)

      //await page.waitForSelector(loadedSelector)
      //await resultsListPlaywright(page)
      $ = cheerio.load(await page.locator(loadedSelector).evaluate(el => el.outerHTML))
      let results = await resultsListCheerio($)
      pages = [...pages, ...results]
    } else {
      finished = true
    }

    /////finished = true
  }

  await browser.close()
  return
}

const loadPage = async (url) => {
  const browser = await playwright.chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: 'networkidle' })

  const loadedSelector = 'div[class="govuk-grid-row govuk-!-margin-top-2"] > div[class="govuk-grid-column-full"]'
  await page.waitForSelector(loadedSelector)
  const html = await page.locator(loadedSelector).evaluate(el => el.outerHTML)
  let $ = cheerio.load(html)

  const results = {}
  $('h2[class="govuk-heading-l govuk-!-margin-bottom-2"]').map(async (i, el) => {
    const title = $(el).text().trim()
    let text = '', html = ''
    el = $(el)
    while (el = el.next()) {
      if (el.length === 0 || el.prop('tagName') === 'H2') break
      //text += $('li').get() ? ($('li').get().map(e => $(e).text().trim()).join(' ')) : (el.text() + '\n')
      text += el.text() + '\n'
      html += el.html()
    }

    let result = convert(html.replace(new RegExp('</li>', 'g'), '; </li>'), {
      preserveNewlines: true,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' }
      ]
    }).trim() //text.trim()

    if (result.substring(result.length - 1) === ';') result = result.substring(0, result.length - 1).replace(new RegExp('\n', 'g'), ' ')

    results[title] = result
  }).get()

  await browser.close()
  return results
}

const splitDates = (results) => {
  const updated = []

  for (const item of results) {
    if (item['Time-Scale and Cost']) {
      const details = item['Time-Scale and Cost'].split('\n').map(x => {
        return x.replace(/[a-zA-Z:]/g, '')
      })

      if (details.length === 4) {
        item['Date From'] = details[1]
        item['Date To'] = details[2]
        item['Cost'] = details[3]

        delete item['Time-Scale and Cost']
      }
    }

    updated.push(item)
  }

  return updated
}

const splitDatesAndSave = async (fileName) => {
  const data = fs.readFileSync(fileName)
  const results = JSON.parse(data)
  const updated = splitDates(results)

  fs.writeFile(fileName, JSON.stringify(updated),
  err => {
    if (err) throw err
    console.log('Finished')
  })
}


(async () => {
  const url = 'https://sciencesearch.defra.gov.uk/'
  const directoryPath = `${__dirname}/../data/`
  const filter = 'evaluations'
  const fileName = `sciencesearch.defra.gov.uk${filter != '' ? '_' + filter : ''}.json`
  await loadPages(url, filter)
  pages = splitDates(pages)
  //console.log((pages))

  fs.writeFile(`${directoryPath}${fileName}`, JSON.stringify(pages),
  err => {
    if (err) throw err
    console.log('Finished')
  })/**/

  //await splitDatesAndSave(`${directoryPath}${fileName}`)
})()
