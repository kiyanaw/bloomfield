const fs = require("fs");
const docx = require("docx");
const xml = require("xmldoc");

const { Document, Paragraph, HeadingLevel, Packer, TextRun, Text } = docx;

const doc = new Document();

const l1 = [];
const l2 = [];

let last = null;
let quotesOpen = false;
let footIndex = 1;

const processChildren = function (node, out = null) {
  console.log("node", node.name, node.children);
  out = out || [];
  if (node.children) {
    for (const child of node.children) {
      if (child.name === "head") {
        const header = child.val
          .replace("PCT", "")
          .replace(" -", ".")
          .replace(": ", ".")
          .toUpperCase();
        out.push(
          new Paragraph({ text: header, heading: HeadingLevel.HEADING_2 })
        );
      } else if (child.name === "docauthor") {
        out.push(
          new Paragraph({
            text: child.val,
            heading: HeadingLevel.HEADING_2,
          })
        );
      } else {
        if (child.name === "p") {
          // console.log("In paragraph");
          const children = processChildren(child);
          console.log("paragraph children", children);
          out.push(
            new Paragraph({
              text: "hello",
              children,
              // children: [
              //   new TextRun({
              //     text: `(${child.attr.n})`,
              //     size: 12,
              //   }),
              // ],
            })
          );
          // console.log("out paragraph");
        } else if (child.name === "q") {
          // console.log("got to q");
          const quote = quotesOpen ? "'" : '"';
          const open = ["index", "closeQuote", "punct"].includes(last)
            ? ` ${quote}`
            : `${quote}`;

          const children = processChildren(child);
          out.push(new TextRun({ text: quote }));
          out.push(...children);
          out.push(new TextRun({ text: quote }));

          // l1.push(open);
          // last = "openQuote";
          // quotesOpen = true;
          // processChildren(child);
          // l1.push(`${quote}`);
          // last = "closeQuote";
          // quotesOpen = false;
        } else if (child.name === "w") {
          // console.log("got to w");
          // const space = ["openQuote", "index", "foot"].includes(last)
          //   ? ""
          //   : " ";
          out.push(new TextRun({ text: child.attr.canon }));
          // last = "word";
        }
        // else if (child.name === "gloss") {
        //   l2.push(` ${child.val}`);
        // } else if (child.name === "note") {
        //   l1.push(`<sup>${footIndex}</sup></p>`);
        //   const val = child.val.replace(/\{/g, "<em>").replace(/\}/g, "</em>");
        //   l1.push(
        //     `\n\n<p><small><sup>${footIndex}</sup>${val}</small><p>\n\n<p>`
        //   );
        //   last = "foot";
        //   footIndex++;
        // }
        else {
          processChildren(child, out);
        }
      }
    }
    return out;
  } else {
    const item = node.text.replace(/\n/g, "");
    if (item) {
      // console.log("punct");
      out.push(
        new TextRun({
          text: item,
        })
      );
      // l1.push(node.text.replace(/\n/g, ""));
      // last = "punct";
    }
  }
  // console.log(out.length);
  // return out;
};

const main = async (infile) => {
  // console.log("infile", infile);
  const raw = fs.readFileSync(infile).toString();
  const parsed = new xml.XmlDocument(raw);

  const get = (path) => {
    return parsed.descendantWithPath(path);
  };

  const children = processChildren(get("text.body"));
  // console.log(children);

  doc.addSection({
    children,
  });

  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("test.docx", buffer);
  });
};

main(process.argv[2]);
