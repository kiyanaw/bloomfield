const fs = require("fs");
const xml = require("xmldoc");

const l1 = [];
const l2 = [];

let last = null;
let quotesOpen = false;
let footIndex = 1;

const processChildren = (node) => {
  if (node.children) {
    for (const child of node.children) {
      if (child.name === "head") {
        const header = child.val
          .replace("PCT", "")
          .replace(" -", ".")
          .replace(": ", ".")
          .toUpperCase();
        l1.push(`<h2>${header}</h2>\n`);
        l2.push(`<h2>${header}</h2>\n`);
      } else if (child.name === "docauthor") {
        l1.push(`<h3>${child.val}</h3>\n`);
        l2.push(`<h3>${child.val}</h3>\n`);
      } else {
        if (child.name === "p") {
          l1.push(
            `\n<p class='paragraph crk' id='${child.attr.n}'><strong style='font-size: 0.9em'>(<a href="#${child.attr.n}">${child.attr.n}</a>)</strong> `
          );
          l2.push(
            `\n<p class='paragraph eng'><strong style='font-size: 0.9em'>(${child.attr.n})</strong> `
          );
          last = "index";
          processChildren(child);
          l1.push("</p>\n");
          l2.push("</p>\n");
        } else if (child.name === "q") {
          const quote = quotesOpen ? "'" : '"';
          const open = ["index", "closeQuote", "punct"].includes(last)
            ? ` ${quote}`
            : `${quote}`;
          l1.push(open);
          last = "openQuote";
          quotesOpen = true;
          processChildren(child);
          l1.push(`${quote}`);
          last = "closeQuote";
          quotesOpen = false;
        } else if (child.name === "w") {
          const space = ["openQuote", "index", "foot"].includes(last)
            ? ""
            : " ";
          l1.push(`${space}${child.attr.canon}`);
          last = "word";
        } else if (child.name === "gloss") {
          l2.push(` ${child.val}`);
        } else if (child.name === "note") {
          l1.push(`<sup>${footIndex}</sup></p>`);

          const val = child.val.replace(/\{/g, "<em>").replace(/\}/g, "</em>");
          l1.push(
            `\n\n<p class="footnote"><small><sup>${footIndex}</sup>${val}</small><p>\n\n<p>`
          );
          last = "foot";
          footIndex++;
        } else {
          processChildren(child);
        }
      }
    }
  } else {
    if (node.text) {
      const item = node.text.replace(/\n/g, "");
      if (item) {
        l1.push(node.text.replace(/\n/g, ""));
        last = "punct";
      }
    }
  }
};

const main = async (infile) => {
  // console.log("infile", infile);
  const raw = fs.readFileSync(infile).toString();
  const parsed = new xml.XmlDocument(raw);

  const get = (path) => {
    return parsed.descendantWithPath(path);
  };
  processChildren(get("text.body"));

  const l1Bits = l1
    .join("")
    .split("\n")
    .filter((item) => item);
  // console.log(l1Bits);

  const l1Chunks = {};
  const foots = [];
  let count = 0;
  for (const bit of l1Bits) {
    if (bit.includes("<p")) {
      if (bit.includes("paragraph crk")) {
        count = count + 1;
        l1Chunks[count] = [];
      }
      if (bit.includes("footnote")) {
        foots.push(bit);
      } else {
        l1Chunks[count].push(bit);
      }
    }
  }

  const l2Bits = l2
    .join("")
    .split("\n")
    .filter((item) => item);

  const l2Chunks = {};
  // const foots = [];
  count = 0;
  for (const bit of l2Bits) {
    if (bit.includes("<p")) {
      if (bit.includes("paragraph eng")) {
        count = count + 1;
        l2Chunks[count] = [];
      }
      if (bit.includes("footnote")) {
        foots.push(bit);
      } else {
        l2Chunks[count].push(bit);
      }
    }
  }
  // console.log(l2Chunks);

  // spit out headers
  // console.log(l1Bits[0]);
  // console.log(l1Bits[1]);
  let output = `${l1Bits[0]}${l1Bits[1]}`;

  // console.log(l1Chunks);
  // console.log(l2Chunks);

  output += `<table>`;
  for (const key in l1Chunks) {
    output += `<tr><td width="50%">${l1Chunks[key].join("")}</td><td>${l2Chunks[
      key
    ].join("")}</td></tr>`;
  }
  output += `<tr><td colspan=2><h4>Footnotes</h4>${foots.join("")}</td></tr>`;
  output += "</table>";

  const template = fs.readFileSync("./template.html").toString();

  console.log(template.replace("{{ body }}", output));
};

main(process.argv[2]);
