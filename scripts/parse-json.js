const fs = require('fs')
const xml = require('xmldoc')

const processText = (tokens) => {
  return tokens.filter((token) => token).reduce((memo, token, index) => {
    if (index === 0) return `${token}`
    if (token === ',') return `${memo}${token}`
    if (token === '.') return `${memo}${token}`
    if (token === ';') return `${memo}${token}`
    if (token === '!') return `${memo}${token}`
    return `${memo} ${token}`
  }, '')
}

const processQuote = (node) => {
  if (!node.children) return node

  const quote = node.children.map((child) => {
    if (child.name === 'w') return child.val
    if (child.text) return child.text.replaceAll('\n', '')
    return null
  })

  const processedQuote = processText(quote)

  return `'${processedQuote}'`
}

const processAnalysis = (node) => {
  if (!node.children) return node

  const analysis = node.children.map((child) => {
    if (child.name === 'q') {
      const transformed = processAnalysis(child)
      return transformed
    }
    if (child.name === 'w') return { surface: child.attr.canon, analysis: "TODO" }
    return null
  }).filter((token) => token)

  return analysis
}

const processSequence = (node) => {
  if (!node.children) return node

  const analysis = processAnalysis(node)

  const text = node.children.map((child) => {
    if (child.name === 'q') {
      const transformed = processQuote(child)
      return transformed
    }
    if (child.name === 'w') return child.val
    if (child.text) return child.text.replaceAll('\n', '')
    return null
  })

  const processedText = processText(text)

  const english = node.children.map((child) => {
    if (child.name === 'gloss') return child.val
    return null
  }).filter((token) => token)[0]

  const footnote = node.children.map((child) => {
    if (child.name === 'note') return child.val
    return null
  }).filter((token) => token)[0]

  return { text: processedText, english, footnote, analysis }
}

const processChildren = (node) => {
  if (!node.children) return node

  const processedBody = node.children.map((child) => {
    if (child.name === 'p') {
      const sentences = processChildren(child)

      const transformedSentence = sentences.filter((token) => token)

      return { id: child.attr.n, sentences: transformedSentence }
    }
    if (child.name === 'seg') {
      const { text, english, footnote, analysis } = processSequence(child)
      return { id: child.attr.n, text, english, footnote, analysis }
    }
    return null
  }).filter((token) => token)

  return processedBody
}

const processXml = (node) => {
  if (!node.children) return node

  const headEntry = node.children.find((child) => {
    if (child.name === 'head') return true
    return false
  })

  const authorEntry = node.children.find((child) => {
    if (child.name === 'docauthor') return true
    return false
  })

  const body = processChildren(node)

  const text = { body: {} }

  if (headEntry && headEntry.val) {
    text.body.title = headEntry.val
  }

  if (authorEntry && authorEntry.val) {
    text.body.author = authorEntry.val
  }

  text.body.body = body

  const processedJson = { text }

  return processedJson
}

const main = async (infile) => {
  const xmlRaw = fs.readFileSync(infile).toString()
  const xmlParsed = new xml.XmlDocument(xmlRaw)

  const children = processXml(xmlParsed.descendantWithPath('text.body'))
  const json = JSON.stringify(children)

  console.log(json)
}

main(process.argv[2])
