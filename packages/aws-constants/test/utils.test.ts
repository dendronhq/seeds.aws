import {
  normalizeServiceName,
  awsAliasToFull,
  awsSuffixToFullServiceName,
  validateAWSServiceName,
} from "../src/utils";
import { ServiceNames } from "../src";
import * as _ from "lodash";

describe("awsAliasToFull", () => {
  test("emr", () => {
    expect(awsAliasToFull("EMR")).toEqual("Elastic MapReduce");
  });
  test("CLB", () => {
    expect(awsAliasToFull("CLB")).toEqual("Classic Load Balancer");
  });
  test("s3", () => {
    expect(awsAliasToFull("s3")).toEqual("Simple Storage Service");
  });
  test("exapnd inside normalize", () => {
    expect(normalizeServiceName("EMR")).toEqual("Elastic MapReduce");
  });
  test("exapnd inside normalize 2", () => {
    expect(normalizeServiceName("QLDB")).toEqual("Quantum Ledger Database");
  });
});

describe("normalizeServiceName", () => {
  test.each([
    ["default", {}, "AWS CloudFormation"],
    [
      "no sp, no snake",
      { stripPrefix: false, snakeCase: false },
      "AWS CloudFormation",
    ],
    [
      "no sp, yes snake",
      { stripPrefix: false, snakeCase: true },
      "AWS_CLOUD_FORMATION",
    ],
    [
      "yes sp, no snake",
      { stripPrefix: true, snakeCase: false },
      "CloudFormation",
    ],
    [
      "yes sp, yes snake",
      { stripPrefix: true, snakeCase: true },
      "CLOUD_FORMATION",
    ],
    [
      "no sp, no snake, yes slug",
      { stripPrefix: false, snakeCase: false, slugName: true },
      "AWS CloudFormation",
    ],
    [
      "no sp, yes snake, yes slug",
      { stripPrefix: false, snakeCase: true, slugName: true },
      "AWS_CLOUDFORMATION",
    ],
    [
      "yes sp, no snake, yes slug",
      { stripPrefix: true, snakeCase: false, slugName: true },
      "CloudFormation",
    ],
    [
      "yes sp, yes snake, yes slug",
      { stripPrefix: true, snakeCase: true, slugName: true },
      "CLOUDFORMATION",
    ],
  ])(
    "with prefix, %s, options: %p",
    // @ts-ignore
    (_desc, opts, expected) => {
      expect(
        normalizeServiceName(ServiceNames.AWS_CLOUD_FORMATION, opts)
      ).toEqual(expected);
    }
  );

  test.each([
    ["default", {}, "Service Quotas"],
    [
      "no sp, no snake",
      { stripPrefix: false, snakeCase: false },
      "Service Quotas",
    ],
    [
      "no sp, yes snake",
      { stripPrefix: false, snakeCase: true },
      "SERVICE_QUOTAS",
    ],
    [
      "yes sp, no snake",
      { stripPrefix: true, snakeCase: false },
      "Service Quotas",
    ],
    [
      "yes sp, yes snake",
      { stripPrefix: true, snakeCase: true },
      "SERVICE_QUOTAS",
    ],
    [
      "no sp, no snake, yes slug",
      { stripPrefix: false, snakeCase: false, slugName: true },
      "ServiceQuotas",
    ],
    [
      "no sp, yes snake, yes slug",
      { stripPrefix: false, snakeCase: true, slugName: true },
      "SERVICEQUOTAS",
    ],
    [
      "yes sp, no snake, yes slug",
      { stripPrefix: true, snakeCase: false, slugName: true },
      "ServiceQuotas",
    ],
    [
      "yes sp, yes snake, yes slug",
      { stripPrefix: true, snakeCase: true, slugName: true },
      "SERVICEQUOTAS",
    ],
  ])(
    "no prefix, %s, options: %p",
    // @ts-ignore
    (_desc, opts, expected) => {
      expect(normalizeServiceName(ServiceNames.SERVICE_QUOTAS, opts)).toEqual(
        expected
      );
    }
  );

  test.each([
    ["default", {}, "AWS Cloud Development Kit"],
    [
      "no sp, no snake, no paren",
      { stripPrefix: false, snakeCase: false, stripParen: true },
      "AWS Cloud Development Kit",
    ],
  ])(
    "no prefix, %s, options: %p",
    // @ts-ignore
    (_desc, opts, expected) => {
      expect(
        normalizeServiceName("AWS Cloud Development Kit (AWS CDK)", opts)
      ).toEqual(expected);
    }
  );

  test.each([
    ["default", {}, "Amazon Elastic MapReduce"],
    [
      "no sp, no snake, expand alias",
      { stripPrefix: false, snakeCase: false, expandAlias: true },
      "Amazon Elastic MapReduce",
    ],
  ])(
    "no prefix, %s, options: %p",
    // @ts-ignore
    (_desc, opts, expected) => {
      expect(normalizeServiceName("Amazon EMR", opts)).toEqual(expected);
    }
  );

  test("clb", () => {
    expect(normalizeServiceName("clb", { stripPrefix: true })).toEqual(
      "Classic Load Balancer"
    );
  });

  test("capitalize", () => {
    expect(
      normalizeServiceName("Amazon Quicksight", { snakeCase: false })
    ).toEqual("Amazon QuickSight");
  });

  test("strip paren", () => {
    expect(
      normalizeServiceName("Amazon Elastic Block Store (EBS)", {})
    ).toEqual("Amazon Elastic Block Store");
  });

  test("strip paren, snake case", () => {
    expect(
      normalizeServiceName("Amazon Elastic Block Store (EBS)", {
        snakeCase: true,
      })
    ).toEqual("AMAZON_ELASTIC_BLOCK_STORE");
  });

  test("aws glacier", () => {
    expect(normalizeServiceName("Amazon Glacier", {})).toEqual(
      "Amazon S3 Glacier"
    );
  });

  test("all service names", () => {
    // @ts-ignore
    expect(
      // @ts-ignore
      _.values(ServiceNames).map((s: string) => normalizeServiceName(s, {}))
    ).toMatchSnapshot();
  });
});

describe("awsSuffixToFullServiceName", () => {
  test("normal suffix", () => {
    expect(awsSuffixToFullServiceName("Wavelength")).toEqual(
      "Amazon Wavelength"
    );
  });
  test("suffix with mult entities", () => {
    expect(awsSuffixToFullServiceName("S3 Glacier")).toEqual(
      "Amazon S3 Glacier"
    );
  });
  test("suffix with mult entities 2", () => {
    expect(awsSuffixToFullServiceName("Quantum Ledger Database")).toEqual(
      "Amazon Quantum Ledger Database"
    );
  });
});

describe("validateAWSServiceName", () => {
  test("validate", () => {
    expect(
      validateAWSServiceName("Amazon Quantum Ledger Database")
    ).toBeTruthy();
  });
});
