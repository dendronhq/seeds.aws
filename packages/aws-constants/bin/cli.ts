#!/usr/bin/env node

import * as yargs from "yargs";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as execa from "execa";
import * as pino from "pino";
import Axios from "axios";
import { normalizeServiceName, awsGetPrefix } from "../src/utils";
const L = pino();
const SOURCES = ["managed_policies", "service_names", "service_names_v2"];

function classFromJson({ jsonObj, key }: { jsonObj: any; key: string }) {
  let out =
    "// NOTE: THIS IS MACHINE GENERATED. CHANGES WILL BE OVERWRITTEN!\n\n";
  out += `export class ${_.upperFirst(_.camelCase(key))} {\n`;
  _.each(jsonObj, (v, k) => {
    out += `    public static readonly ${k} = "${v}"\n`;
  });
  out += "}";
  return out;
}

async function fetchConstants({ target }: { target: string }) {
  L.info({ ctx: "fetchConstants/enter", target });
  try {
    switch (target) {
      case "managed_policies": {
        let cmd = `python data/all_aws_managed_policies/show_all_aws_managed_policies.py > data/all_aws_managed_policies/all_aws_managed_policies.json`;
        let out = await execa.command(cmd);
        L.info({ ctx: "fetchConstants/exit", out });
        break;
      }
      case "service_names": {
        const { data: json } = await Axios.get(
          "https://docs.aws.amazon.com/IAM/latest/UserGuide/toc-contents.json"
        );
        fs.writeJsonSync("data/all_services.json", json);
        const service_titles =
          json.contents[10].contents[3].contents[6].contents;
        fs.writeJsonSync("data/all_services_title.json", service_titles);
        break;
      }
      case "service_names_v2": {
        const { data: json } = await Axios.get(
          "https://raw.githubusercontent.com/AwsGeek/aws-history/master/services.json"
        );
        const services = _.mapKeys(json.services, (v, _) => v.name);
        fs.writeJsonSync("data/services.json", services);
        break;
      }
      default:
        throw `invalid target: ${target}`;
    }
  } catch (err) {
    L.error({ ctx: "fetchConstants/error", err });
    throw err;
  }
}

async function updateConstants({ target }: { target: string }) {
  switch (target) {
    case "managed_policies": {
      let data = fs.readJsonSync(
        "./data/all_aws_managed_policies/all_aws_managed_policies.json"
      );
      let results: any = {};
      let blacklist = ["S_3", "EC_2", "IO_T"];
      L.info({ ctx: "updateConstants/startConverting", target });
      _.keys(data).forEach((key: string) => {
        let modKey = _.snakeCase(key).toUpperCase();
        blacklist.forEach(ent => {
          if (modKey.indexOf(ent) >= 0) {
            modKey = modKey.replace(ent, ent.replace("_", ""));
          }
        });
        let { Arn } = data[key];
        /**
         * ARN will look like the following:
         *    arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
         * we want to find `aws:policy` and take the name of everything after
         */
        let idx = Arn.indexOf("aws:policy") + 11;
        results[modKey] = Arn.slice(idx);
      });
      L.info({ ctx: "updateConstants/stopConverting" });
      let payload = classFromJson({
        jsonObj: results,
        key: "MANAGED_POLICIES"
      });
      fs.writeFileSync("./lib/policies.ts", payload);
      L.info({ ctx: "updateConstants/exit" });
      return;
    }
    case "service_names_v2": {
      let data = fs.readJsonSync("./data/services.json");
      let out: any = {};
      let out2: any = {};
      let out3: any = {};

      let extra = [
        { name: "Service Quotas" },
        { name: "Amazon Lumberyard" },
        { name: "AWS Cloud Development Kit" },
        { name: "Application Load Balancer" },
        { name: "Classic Load Balancer" }
      ];
      _.each(_.values(data).concat(extra), ent => {
        let name = ent.name;
        out[
          normalizeServiceName(name, {
            snakeCase: true,
            expandAlias: true
          }).toUpperCase()
        ] = normalizeServiceName(name, { snakeCase: false });

        out2[
          normalizeServiceName(name, {
            snakeCase: true,
            expandAlias: true,
            stripPrefix: true
          }).toUpperCase()
        ] = normalizeServiceName(name, { snakeCase: false, stripPrefix: true });

        out3[
          normalizeServiceName(name, {
            snakeCase: true,
            expandAlias: true,
            stripPrefix: true
          }).toUpperCase()
        ] = awsGetPrefix(normalizeServiceName(name, { snakeCase: false }));
      });

      let payload = classFromJson({ jsonObj: out, key: "SERVICE_NAMES" });
      let payload2 = classFromJson({
        jsonObj: out2,
        key: "SERVICE_NAMES_NO_PREFIX"
      });
      let payload3 = classFromJson({
        jsonObj: out3,
        key: "SERVICE_NAMES_TO_PREFIX"
      });
      fs.writeFileSync(
        "./lib/services.ts.swp",
        [payload, payload2, payload3].join("\n")
      );
      fs.moveSync("./lib/services.ts.swp", "./lib/services.ts", {
        overwrite: true
      });
      return;
    }
    // case "service_names": {
    //   let data = fs.readJsonSync("./data/all_services_title.json");
    //   let out: any = {};
    //   _.each(data, ent => (out[normalizeServiceName(ent.title)] = ent.title));
    //   let payload = classFromJson({ jsonObj: out, key: "SERVICE_NAMES" });
    //   fs.writeFileSync("./lib/services_iam.ts", payload);
    //   break;
    // }
    default:
      throw `invalid target: ${target}`;
  }
}

yargs
  .option("stage", {
    alias: "s"
  })
  .command(
    ["fetch [targets]"],
    "fetch constants data",
    yargs => {
      yargs.positional("targets", {
        describe: "what to fetch",
        default: SOURCES.join(","),
        type: "string"
      });
    },
    (argv: any) => {
      L.info({ argv });
      let { targets } = argv;
      targets = targets.split(",");
      try {
        _.reduce(
          targets,
          async (prior: any, target: string) => {
            await prior;
            return fetchConstants({ target });
          },
          Promise.resolve()
        );
      } catch (err) {
        L.error({ err });
      }
    }
  )
  .command(
    ["update [targets]"],
    "update constants",
    yargs => {
      yargs.positional("targets", {
        describe: "constants to update",
        default: SOURCES.join(","),
        type: "string"
      });
    },
    async (argv: any) => {
      let { targets } = argv;
      targets = targets.split(",");
      console.log({ targets, argv });
      const resp = _.map(targets, (target: string) => {
        return updateConstants({ target });
      });
      await Promise.all(resp);
      L.info({ ctx: "update/exit" });
    }
  )
  .demandCommand()
  .help()
  .wrap(72).argv;
