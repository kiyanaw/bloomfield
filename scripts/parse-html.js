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
            `\n<p><strong style='font-size: 0.7em'>(${child.attr.n})</strong> `
          );
          l2.push(
            `\n<p><strong style='font-size: 0.7em'>(${child.attr.n})</strong> `
          );
          last = "index";
          processChildren(child);
          l1.push("</p><br/>\n\n");
          l2.push("</p><br/>\n\n");
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
            `\n\n<p><small><sup>${footIndex}</sup>${val}</small><p>\n\n<p>`
          );
          last = "foot";
          footIndex++;
        } else {
          processChildren(child);
        }
      }
    }
  } else {
    const item = node.text.replace(/\n/g, "");
    if (item) {
      l1.push(node.text.replace(/\n/g, ""));
      last = "punct";
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

  console.log(l1.join(""));
  // console.log("");
  // console.log(l2.join(""));
};

main(process.argv[2]);
