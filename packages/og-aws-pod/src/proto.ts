import path from "path";
import { OgAWSPod } from "./importPod";

async function main() {
  console.log("start");
  const wsRoot= "/Users/kevinlin/projects/dendronv2/dendron-seedbank/vaults/aws";
  const vault = path.join(wsRoot, "vault");
  const pod = new OgAWSPod({roots: [vault], wsRoot})
  await pod.plant({mode: "notes", config: {src: ""}});
  console.log("done");
}

main();
