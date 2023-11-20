const fs = require('fs')
const xml = require('xmldoc')
const { Transducer } = require('hfstol')
const util = require('util')

const transducerPath = `./transducers/crk-relaxed-analyzer.hfstol`;
const fst = new Transducer(transducerPath);
const fraggedWords = [];

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

const processAnalysis = (node, paragraph, sentence) => {
  if (!node.children) return node

  const analysis = node.children.map(async (child) => {
    if (child.name === 'q') {
      return processAnalysis(child, paragraph)
    }
    if (child.name === 'w') {
      const results = fst.lookup(child.attr.canon);

      const resultsDefragged = results.filter((result) => {
        return !result.split('+').includes('Err/Frag');
      });

      if (resultsDefragged.length === 0) {
        fraggedWords.push({
          surface: child.attr.canon,
          nodePosition: {
            paragraph: paragraph,
            sentence: sentence,
          }
        });

        return;
      };

      return { surface: child.attr.canon, analysis: resultsDefragged }
    }


    return null
  }).filter((token) => token)

  return analysis;
}

const processSequence = (node, paragraph, sentence) => {
  if (!node.children) return node

  const text = [];  

  const analysis = processAnalysis(node, paragraph, sentence);

  const original = node.children.map((child) => {
    if (child.name === 'q') {
      return processQuote(child)
    }

    if (child.name === 'w') {
      text.push(child.attr.canon)
      return child.val
    }
    if (child.text) return child.text.replaceAll('\n', '')

    return null
  })

  const processedText = processText(original)

  const english = node.children.map((child) => {
    if (child.name === 'gloss') return child.val
    return null
  }).filter((token) => token)[0]

  const footnote = node.children.map((child) => {
    if (child.name === 'note') return child.val
    return null
  }).filter((token) => token)[0]

  // only return footnote if it exists

  const returnSeq = { original: processedText, text: text.join(' '), english, analysis }

  return footnote !== undefined ? { ...returnSeq, footnote } : returnSeq
}

const processChildren = (node) => {
  if (!node.children) return node

  const processedBody = node.children.map((child) => {
    const paragraph = node.name === 'p' ? node.attr.n : null
    if (child.name === 'p') {
      const sentences = processChildren(child)
 
      const transformedSentence = sentences.filter((token) => token)

      transformedSentence.forEach((sentence) => {
        sentence.original = stripSentence(sentence.original)
        sentence.text = stripSentence(sentence.text)
      })

      return { id: child.attr.n, sentences: transformedSentence }
    }
    if (child.name === 'seg') {
      return { id: child.attr.n, ...processSequence(child, paragraph, child.attr.n) }
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

  const text = { }

  if (headEntry && headEntry.val) {
    text.title = headEntry.val
  }

  if (authorEntry && authorEntry.val) {
    text.author = authorEntry.val
  }

  text.body = body


  return text
}

const main = async (infile) => {
  const xmlRaw = fs.readFileSync(infile).toString()
  const xmlParsed = new xml.XmlDocument(xmlRaw)

  const children = processXml(xmlParsed.descendantWithPath('text.body'))

  // Uncomment this line for easier debugging in the console.
  // console.log(util.inspect(children, {depth: null}))

  return { results: JSON.stringify(children), fraggedResults: JSON.stringify(fraggedWords) }
}

module.exports = main;
