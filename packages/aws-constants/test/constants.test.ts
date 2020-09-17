import {
  FederatedPrincipals,
  ServicePrincipals,
  ManagedPolicies
} from "../src";

describe("principles", () => {
  test("federated", () => {
    expect(FederatedPrincipals.COGNITO_IDENTITY).toEqual(
      "cognito-identity.amazonaws.com"
    );
  });
  test("service", () => {
    expect(Object.keys(ServicePrincipals).length).toEqual(95);
  });
});

describe("policies", () => {
  test("policies", () => {
    expect(Object.keys(ManagedPolicies).length).toEqual(619);
  });
});
