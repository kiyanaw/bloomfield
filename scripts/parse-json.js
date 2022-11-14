const fs = require('fs')
const convert = require('xml-js')

const main = async (infile) => {
  const xml = fs.readFileSync(infile, 'utf-8')

  const options = { ignoreComment: true, compact: true }
  const result = convert.xml2json(xml, options)

  console.log(result)
}

main(process.argv[2])
