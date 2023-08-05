const fs = require('fs')
const xml = require('xmldoc')

const util = require('util')

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

  return processText(quote)
}

const processAnalysis = (node) => {
  if (!node.children) return node

  const analysis = node.children.map((child) => {
    if (child.name === 'q') {
      return processAnalysis(child)
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
      return processQuote(child)
    }

    //This is where we need to replace or get rid of \r, but it doesn't seem to accept a replace all. 

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

  // only return footnote if it exists

  const returnSeq = { text: processedText, english, analysis }

  return footnote !== undefined ? { ...returnSeq, footnote } : returnSeq
}

const processChildren = (node) => {
  if (!node.children) return node

  const processedBody = node.children.map((child) => {
    if (child.name === 'p') {
      const sentences = processChildren(child)
 
      const transformedSentence = sentences.filter((token) => token)

      transformedSentence.forEach((sentence) => {
        sentence.text = stripSentence(sentence.text)
      })

      return { id: child.attr.n, sentences: transformedSentence }
    }
    if (child.name === 'seg') {
      return { id: child.attr.n, ...processSequence(child) }
    }
    return null
  }).filter((token) => token)

  return processedBody
}

const stripSentence = (sentenceText) => {
  // This function processes the sentence to remove \n, \r, and fix double spacing between words and periods
  return sentenceText.replaceAll('\n', '').replaceAll('\r', '').replaceAll('  ', ' ').replace(/(\w+)\s+\./g, '$1.').trim()
}

const processXml = (node) => {
  if (!node.children) return node

  const headEntry = node.children.find((child) => {
    return child.name === 'head'
  })

  const authorEntry = node.children.find((child) => {
    return child.name === 'docauthor'
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


  return { text }
}

const main = async (infile) => {
  const xmlRaw = fs.readFileSync(infile).toString()
  const xmlParsed = new xml.XmlDocument(xmlRaw)

  const children = processXml(xmlParsed.descendantWithPath('text.body'))

  // Uncomment this line for easier debugging in the console.
  // console.log(util.inspect(children, {depth: null}))

  console.log(JSON.stringify(children))
}

main(process.argv[2])
