import { Note } from "@dendronhq/common-all";
import { cleanFileName } from "@dendronhq/common-server";
import {
  getPodPath,
  ImportConfig,
  ImportPodBaseV2,
  ImportPodOpts,
  PodConfigEntry
} from "@dendronhq/pods-core";
import fs from "fs-extra";
import path from "path";
import remark from "remark";
import markdownParse from "remark-parse";
import { URI } from "vscode-uri";
import { GitRepo } from "./git";
import { getOutput, ogAWSPlugin } from "./parseOgAWS";

type TConfig = ImportConfig & {};

export class OgAWSPod extends ImportPodBaseV2<TConfig> {
  static id: string = "pod.og-aws";
  static description: string = "import og aws content";

  static config = (): PodConfigEntry[] => {
    return [
      {
        key: "src",
        description: "where will notes be imported from",
        type: "string",
      },
    ];
  };

  async plant(opts: ImportPodOpts<TConfig>): Promise<void> {
    const cleanConfig = this.cleanConfig(opts.config);
    await this.prepare(opts);
    await this.execute(cleanConfig);
  }

  async fetch() {
    const podsDir = path.join(this.opts.wsRoot, "pods");
    const podPath = getPodPath(podsDir, OgAWSPod);
    const repoPath = path.join(podPath, "repo");
    if (!fs.existsSync(repoPath)) {
      const repo = new GitRepo({
        localUrl: repoPath,
        remoteUrl: "https://github.com/open-guides/og-aws.git",
      });
      await repo.checkout();
    } else {
      // throw Error("pull not implemented");
    }
    return repoPath;
  }

  async execute(_opts: { src: URI }) {
    const ctx = "OgAWSPod";
    this.L.info({ ctx, msg: "enter" });
    const fetchedSrc = await this.fetch();
    this.L.info({ ctx, msg: "done fetching" });
    const fpath = path.join(fetchedSrc, "README.md");
    const dataPath = fs.readFileSync(fpath, { encoding: "utf8" });
    remark()
      .use(markdownParse, { gfm: true })
      .use(ogAWSPlugin)
      .processSync(dataPath);
    const output = getOutput();
    fs.writeJSONSync("/tmp/out.json", output, { spaces: 4 });

    const dataSplit = dataPath.split("\n");
    await Promise.all(
      // skip last one, high availability
      output.slice(0, -1).map(async (ent, index) => {
        const { name, payload } = ent;
        let start = payload.position?.start.line as number;
        start += 1;
        let end = output[index + 1]?.payload.position?.start.line || -1;
        end -= 1;
        const content = [`# ${name}`].concat(dataSplit.slice(start, end));
        const cleanName = cleanFileName(name.toLowerCase()).replace(",","");
        const fname = `s.${cleanName}`;
        const n = new Note({ id: cleanName, created: "0", updated: "0", fname, body: content.join("\n") });
        console.log(fname);
        return this.engine.write(n, {
          newNode: true,
        });
      })
    );
  }
}
