const parser = require('./parse-json.js');
const fs = require('fs');
const util = require('util');
const path = require('path');


const DEFAULT_INPUT_DIR = `./source/PCT`;
const DEFAULT_OUTPUT_DIR = `./json`;

const bulkParse = (input, output) => {
    if (!fs.existsSync(input) ) {
        throw new Error(`${input} directory could not be found or opened.`);
    }

    if (!fs.existsSync(output)) {
        fs.mkdirSync(output);
    } else {
        fs.readdir(output, (err, files) => {
            if (err) throw new Error(err);

            files.forEach((file) => {
                fs.unlink(path.join(output, file), (err) => {
                    if (err) {
                        throw new Error(err);
                    } 
                });
            })
        })
    }

    fs.readdir(input, { withFileTypes: true }, (err, files) => {
        if (err) throw new Error(err);

        let outputCount = 1;

        files.forEach((file) => {
            let fileName = `json-pct-${outputCount}.json`;
            let fileOutPath = path.join(output, fileName);
            
            parser(path.join(input, file.name)).then((result) => {
                fs.writeFile(fileOutPath, result, (err) => {
                    if (err) { 
                        throw new Error(err);
                    }
                });
            });

            outputCount++;
        })
    })
};

const main = async (input = DEFAULT_INPUT_DIR, output = DEFAULT_OUTPUT_DIR) => {
    try {
        bulkParse(input, output);
    } catch (err) {
        console.error("ERROR BULK PARSING... NOT OK")
        console.error(err);
    }
}

main(process.argv[2])
