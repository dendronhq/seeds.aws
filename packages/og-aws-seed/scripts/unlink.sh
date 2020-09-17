#!/bin/bash

    #"@dendronhq/aws-constants": "^3.0.3",
# unlink
#lerna add @dendronhq/seeds-core --scope @dendronhq/og-aws-seed


yarn unlink @dendronhq/seeds-core
yarn unlink @dendronhq/aws-constants
yarn add --force @dendronhq/seeds-core
lerna add @dendronhq/aws-constants --scope @dendronhq/og-aws-seed
lerna add @dendronhq/seeds-core --scope @dendronhq/og-aws-seed