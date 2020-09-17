import {
  normalizeServiceName,
  validateAWSServiceName,
} from "@dendronhq/aws-constants";
import { Note } from "@dendronhq/common-all";
import {
  DendronSeed,
  PrepareOpts,
  SeedConfig,
  Asset,
} from "@dendronhq/seeds-core";
import { cleanFileName } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export default class AWSGeekSeed extends DendronSeed {
  config(): SeedConfig {
    return {
      src: {
        type: "git" as const,
        url: "https://github.com/AwsGeek/awsgeek.github.io.git",
      },
      mergeStrategy: "insertAtTop",
      source: {
        name: "Jerry Hargrove",
        url: "https://www.awsgeek.com/",
        license:
          "Creative Commons Attribution-ShareAlike 4.0 International License",
      },
    };
  }

  async prepare(opts: PrepareOpts) {
    const cleanImageName = (name: string) => {
      name = path.basename(name, "jpg");
      name = _.trim(name.replace("_en", ""));
      name = name.replace(/-/g, " ");
      name = _.trim(name, "-.");
      // console.log({normalize: true, name});
      name = normalizeServiceName(name, {
        stripPrefix: true,
        expandAlias: true,
      });
      name = _.trim(name, "-.");
      return name;
    };
    const ctx = "prepare";
    this.L.info({ ctx, opts });
    const { root } = opts;
    const fpath = path.join(root, "images");
    const dataPath = fs.readdirSync(fpath);
    const mapping: any = {};
    let notes: Note[] = [];
    let assets: Asset[] = [];
    _.reject(dataPath, (ent) => {
      const bad = ["-small.jpg", "-thumbnail_en.jpg"];
      return _.some(bad, (suffix) => ent.endsWith(suffix));
    }).map((ent) => {
      const nname = cleanImageName(ent);
      console.log(nname);
      if (validateAWSServiceName(nname, { stripPrefix: true })) {
        mapping[nname] = ent;
        const cleanName = cleanFileName(nname.toLowerCase()).replace(/,/g, "");
        const fname = `s.${cleanName}`;
        // TODO: only do exact matches for now
        const newFilePath = path.join(this.engine.props.root, fname + "md");
        if (fs.pathExists(newFilePath)) {
          const pageLink = _.replace(path.basename(ent, ".jpg"), /_en$/, "");
          notes.push(
            new Note({
              id: cleanName,
              title: nname,
              created: "0",
              updated: "0",
              fname,
              body: [
                `![](/assets/images/${ent})`,
                `> Image from [@awsgeek](https://www.awsgeek.com/${pageLink}/)`,
              ].join("\n"),
            })
          );
          const asset: Asset = {
            srcPath: path.join(fpath, ent),
            dstPath: path.join("images", ent),
          };
          assets.push(asset);
        }
      }
    });
    return { notes, assets };
  }
}
