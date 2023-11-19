const fs = require("fs");
const util = require("util");
const path = require("path");
const parser = require("./parse-json");

const DEFAULT_INPUT_DIR = `./source/PCT`;
const DEFAULT_OUTPUT_DIR = `./json`;

const bulkParse = (input, output) => {
  const helpText = `
  Usage: 
    node bulk-parse.js [inputDir] [outputDir]

    inputDir: The directory containing the XML files to be parsed. Defaults to ${ DEFAULT_INPUT_DIR }.
    outputDir: The directory where the parsed JSON files will be written. Defaults to ${ DEFAULT_OUTPUT_DIR }.
  `
  const inputDir = process.argv[2];
  const outputDir = process.argv[3];

  if (process.argv[2] == "--help" || process.argv[2] == "-h") {
    console.log(helpText);
    process.exit(0);
  }

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
    fs.mkdirSync(path.join(output, 'errors'));
  } else {
    deleteExistingFiles(output);
    fs.mkdirSync(output);
    fs.mkdirSync(path.join(output, 'errors'));
  }

  fs.readdir(input, { withFileTypes: true }, (err, files) => {
    if (err) throw new Error(err);

    let outputCount = 1;

    files.forEach((file) => {
      let fileName = `pct-${outputCount}.json`;
      let fileOutPath = path.join(output, fileName);

      let errorFileName = `pct-${outputCount}.json`
      let errorOutPath = path.join(output, 'errors', errorFileName);

      parser(path.join(input, file.name)).then((result) => {
        fs.writeFile(fileOutPath, result.results, (err) => {
          if (err) throw new Error(err);
        });

        if (JSON.parse(result.fraggedResults).length !== 0) {
          fs.writeFile(errorOutPath, result.fraggedResults, (err) => {
            if (err) throw new Error(err);
          });
        }
      });

      outputCount++;
    });
  });
};

const deleteExistingFiles = (dir) => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file) => {
      const currentPath = path.join(dir, file);

      if (fs.lstatSync(currentPath).isDirectory()) {
        deleteExistingFiles(currentPath);
      } else {
        fs.unlinkSync(currentPath);
      }

    })
    fs.rmdirSync(dir);
  }
};

const main = async (input = DEFAULT_INPUT_DIR, output = DEFAULT_OUTPUT_DIR) => {
  bulkParse(input, output);
};

main(process.argv[3]);
