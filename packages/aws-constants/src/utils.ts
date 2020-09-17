import * as _ from "lodash";
import { ServiceNames, ServiceNamesNoPrefix } from "./services";

const ALIASES = {
  ACM: ServiceNames.AWS_CERTIFICATE_MANAGER,
  ALB: ServiceNames.APPLICATION_LOAD_BALANCER,
  CE: ServiceNames.AWS_COST_EXPLORER,
  CLB: ServiceNames.CLASSIC_LOAD_BALANCER,
  DMS: ServiceNames.AWS_DATABASE_MIGRATION_SERVICE,
  DS: ServiceNames.AWS_DIRECTORY_SERVICE,
  EBS: ServiceNames.AMAZON_ELASTIC_BLOCK_STORE,
  ECR: ServiceNames.AMAZON_ELASTIC_CONTAINER_REGISTRY,
  ECS: ServiceNames.AMAZON_ELASTIC_CONTAINER_SERVICE,
  EFS: ServiceNames.AMAZON_ELASTIC_FILE_SYSTEM,
  EKS: ServiceNames.AMAZON_ELASTIC_CONTAINER_SERVICE_FOR_KUBERNETES,
  ELB: ServiceNames.ELASTIC_LOAD_BALANCING,
  EMR: ServiceNames.AMAZON_ELASTIC_MAP_REDUCE,
  ES: ServiceNames.AMAZON_ELASTICSEARCH_SERVICE,
  MGH: ServiceNames.AWS_MIGRATION_HUB,
  IAM: ServiceNames.AWS_IDENTITY_ACCESS_MANAGEMENT,
  KMS: ServiceNames.AWS_KEY_MANAGEMENT_SERVICE,
  QLDB: ServiceNames.AMAZON_QUANTUM_LEDGER_DATABASE,
  S3: ServiceNames.AMAZON_SIMPLE_STORAGE_SERVICE,
  SES: ServiceNames.AMAZON_SIMPLE_EMAIL_SERVICE,
  SFTP: ServiceNames.AWS_TRANSFER_FOR_SFTP,
  SMS: ServiceNames.AWS_SERVER_MIGRATION_SERVICE,
  SNS: ServiceNames.AMAZON_SIMPLE_NOTIFICATION_SERVICE,
  SQS: ServiceNames.AMAZON_SIMPLE_QUEUE_SERVICE,
  SSO: ServiceNames.AWS_SINGLE_SIGN_ON,
};

// === AWS Utils

export function awsAliasToFull(alias: string): string {
  const key: string = alias.toUpperCase();
  // @ts-ignore
  const longName = ALIASES[key] as string;
  if (longName) {
    return normalizeServiceName(longName, {
      snakeCase: false,
      stripPrefix: true,
      slugName: false,
      expandAlias: false,
    });
  } else {
    return alias;
  }
}

// TODO: generate chart
export const AWS_SERVICE_SUFFIX: any = {
  quicksight: "QuickSight",
};
export function awsCapitalizeServiceName(serviceName: string): string {
  const capitalized: string | undefined =
    AWS_SERVICE_SUFFIX[serviceName.toLowerCase()];
  if (capitalized) {
    return capitalized;
  } else {
    return serviceName;
  }
}

export function awsGetPrefix(serviceName: string): string {
  const match = serviceName.match(/^(AWS|AMAZON)/i);
  if (!_.isNull(match)) {
    return _.trim(match[0]);
  } else {
    return "";
  }
}

export const AWS_ONE_OFF_MAP: any = {
  glacier: "S3 Glacier",
  elasticsearch: "Elasticsearch Service",
  mediastore: "Elemental MediaStore",
  medialive: "Elemental MediaLive",
  mediaconvert: "Elemental MediaConvert",
  lakeformation: "Lake Formation",
  "iot greengrass": "Greengrass",
  iotevents: "IoT Events",
  iot1click: "IoT 1-Click",
  eventbridge: "Event Bridge",
};
/** Normalize suffixes */
export function awsNormalizeOneOffName(name: string): string {
  const resp = AWS_ONE_OFF_MAP[name.toLowerCase()];
  if (!_.isUndefined(resp)) {
    return resp;
  } else {
    return name;
  }
}

export function awsSuffixToFullServiceName(suffix: string): string {
  return _.mapKeys(ServiceNames, (v) => {
    return normalizeServiceName(v as string, { stripPrefix: true });
  })[suffix] as string;
}

/**
 * Default: snake case, capitalize service name, strip paren, expand alias
 * @param name
 * @param opts
    snakeCase: false,
    stripPrefix: false,
    slugName: false,
    stripParen: true,
    expandAlias: true,
    capitalizeName: true
 */
export function normalizeServiceName(
  name: string,
  opts?: {
    snakeCase?: boolean;
    stripPrefix?: boolean;
    slugName?: boolean;
    stripParen?: boolean;
    expandAlias?: boolean;
    capitalizeName?: boolean;
  }
): string {
  const blacklist = ["S_3", "EC_2", "IO_T", "V_2", "F_S", "AP_I"];
  opts = _.defaults(opts, {
    snakeCase: false,
    stripPrefix: false,
    slugName: false,
    stripParen: true,
    expandAlias: true,
    capitalizeName: true,
  });
  let prefix = "";
  let suffix = name;
  let sep = " ";
  const match = name.match(/^(AWS|AMAZON)/i);
  if (!_.isNull(match)) {
    prefix = _.trim(match[0]);
    suffix = _.trim(name.replace(prefix, ""));
  }

  // should be before expanding
  if (opts.stripParen) {
    let paren = suffix.match(/([^(]+)(?<capture>\(.+\))/);
    if (paren && paren.groups && paren.groups.capture) {
      suffix = _.trim(suffix.replace(paren.groups.capture, ""));
    }
  }
  if (opts.expandAlias) {
    suffix = awsAliasToFull(suffix);
  }
  if (opts.capitalizeName) {
    suffix = awsCapitalizeServiceName(suffix);
  }
  suffix = awsNormalizeOneOffName(suffix);

  // destructive
  if (opts.snakeCase) {
    let tmpSuffix = _.snakeCase(suffix).toUpperCase();
    blacklist.forEach((ent) => {
      if (tmpSuffix.indexOf(ent) >= 0) {
        tmpSuffix = tmpSuffix.replace(
          new RegExp(ent, "i"),
          ent.replace("_", "")
        );
      }
    });
    suffix = tmpSuffix;
    sep = "_";
    prefix = prefix.toUpperCase();
  }

  if (opts.stripPrefix) {
    prefix = "";
  }

  if (opts.slugName) {
    suffix = suffix.replace(new RegExp(sep, "g"), "");
  }

  return _.filter([prefix, suffix], (u) => !_.isEmpty(u)).join(sep);
}

export function validateAWSServiceName(
  name: string,
  opts = { stripPrefix: false }
) {
  if (opts.stripPrefix) {
    return _.includes(_.values(ServiceNamesNoPrefix), name);
  } else {
    return _.includes(_.values(ServiceNames), name);
  }
}
