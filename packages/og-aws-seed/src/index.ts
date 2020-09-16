import { Note } from "@dendronhq/common-all";
import { cleanFileName } from "@dendronhq/common-server";
import { DendronSeed, PrepareOpts } from "@dendronhq/seeds-core";
import fs from "fs-extra";
import path from "path";
import remark from "remark";
import markdownParse from "remark-parse";
import { getOutput, ogAWSPlugin } from "./parseOgAWS";

export class OgAWSSeed extends DendronSeed {
  config() {
    return {
      src: {
        type: "git" as const,
        url: "https://github.com/open-guides/og-aws.git",
      },
    };
  }

  async prepare(opts: PrepareOpts) {
    console.log(opts);
    const { root } = opts;
    const fpath = path.join(root, "og-aws", "README.md");
    const dataPath = fs.readFileSync(fpath, { encoding: "utf8" });
    remark()
      .use(markdownParse, { gfm: true })
      .use(ogAWSPlugin)
      .processSync(dataPath);
    const output = getOutput();
    fs.writeJSONSync("/tmp/out.json", output, { spaces: 4 });
    const dataSplit = dataPath.split("\n");
    // skip last one, high availability
    const notes = output.slice(0, -1).map((ent, index) => {
      const { name, payload } = ent;
      let start = payload.position?.start.line as number;
      start += 1;
      let end = output[index + 1]?.payload.position?.start.line || -1;
      end -= 1;
      const content = [`# ${name}`].concat(dataSplit.slice(start, end));
      const cleanName = cleanFileName(name.toLowerCase()).replace(",", "");
      const fname = `s.${cleanName}`;
      return new Note({
        id: cleanName,
        created: "0",
        updated: "0",
        fname,
        body: content.join("\n"),
      });
    });
    fs.writeJSONSync("/tmp/out2.json", notes, { spaces: 4 });
    return notes;
  }
}
