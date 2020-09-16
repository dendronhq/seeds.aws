import path from "path";
import { OgAWSSeed } from ".";

async function main() {
  console.log("start");
  const wsRoot= "/Users/kevinlin/projects/dendronv2/dendron-seedbank/vaults/aws";
  const vault = path.join(wsRoot, "vault");
  const seed = new OgAWSSeed({name: "og-aws-seed", roots: [vault], wsRoot})
  await seed.plant();
  // const pod = new OgAWSPod({roots: [vault], wsRoot})
  // await pod.plant({mode: "notes", config: {src: ""}});
  console.log("done");
}

main();
