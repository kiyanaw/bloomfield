const fs = require("fs");
const util = require("util");
const path = require("path");
const parser = require("./parse-json");

const DEFAULT_INPUT_DIR = `./source/PCT`;
const DEFAULT_OUTPUT_DIR = `./json`;

const bulkParse = (input, output) => {
  const inputDir = process.argv[2];
  const outputDir = process.argv[3];

  if (!inputDir) {
    console.log(`No input directory specified. Using default ${ DEFAULT_INPUT_DIR }`);
  };

  if (!outputDir) {
    console.log(`No output directory specified. Using default ${ DEFAULT_OUTPUT_DIR }`);
  };

  if (!fs.existsSync(input)) {
    throw new Error(`${input} directory could not be found or opened.`);
  }

  if (!fs.existsSync(output)) {
    fs.mkdirSync(output);
  } else {
    fs.readdir(output, (error, files) => {
      if (error) throw error;

      files.forEach((file) => {
        fs.unlink(path.join(output, file), (err) => {
          if (err) {
            throw new Error(err);
          }
        });
      });
    });
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
    });
  });
};

const main = async (input = DEFAULT_INPUT_DIR, output = DEFAULT_OUTPUT_DIR) => {
  bulkParse(input, output);
};

main(process.argv[3]);
