import { Note } from "@dendronhq/common-all";
import { DendronSeed, PrepareOpts } from "@dendronhq/seeds-core";
import fs from "fs-extra";
import path from "path";

export default class AWSGeekSeed extends DendronSeed {
  config() {
    return {
      src: {
        type: "git" as const,
        url: "https://github.com/AwsGeek/awsgeek.github.io.git",
      },
    };
  }

  async prepare(opts: PrepareOpts) {
      const cleanImageName = (name: string) => {
        return name.replace('thumbnail_en', '');
      }
    const ctx = "prepare";
    this.L.info({ctx, opts});
    const { root } = opts;
    const fpath = path.join(root, "images");
    const dataPath = fs.readdirSync(fpath);
    dataPath.map(ent => {
      console.log(ent);
    });
    const mapping = {};
    let notes: Note[] = [];

    // const notes = output.slice(0, -1).map((ent, index) => {
    //   const { name, payload } = ent;
    //   let start = payload.position?.start.line as number;
    //   start += 1;
    //   let end = output[index + 1]?.payload.position?.start.line || -1;
    //   end -= 1;
    //   const nname = normalizeServiceName(name);
    //   const content = [`# ${nname}`].concat(dataSplit.slice(start, end));
    //   const cleanName = cleanFileName(nname.toLowerCase()).replace(/,/g, "");
    //   const fname = `s.${cleanName}`;
    //   return new Note({
    //     id: cleanName,
    //     title: nname,
    //     created: "0",
    //     updated: "0",
    //     fname,
    //     body: content.join("\n"),
    //     custom: {
    //       source: {
    //         name: "og-aws",
    //         url: "https://github.com/open-guides/og-aws"
    //       }
    //     }
    //   });
    // });
    return notes;
  }
}
