# @ecency/sdk

Utilities for building Hive applications with React and TypeScript.

## Features

- Query and mutation option builders powered by [@tanstack/react-query](https://tanstack.com/query)
- Modules for accounts, posts, operations, communities, games, analytics, keychain integrations, and more
- Configurable Hive RPC client and storage via the `CONFIG` object

## Installation

```sh
yarn add @ecency/sdk
# or
npm install @ecency/sdk
```

## Usage

```ts
import { getAccountFullQueryOptions, ConfigManager } from '@ecency/sdk';
import { useQuery } from '@tanstack/react-query';

// optionally provide a custom QueryClient
// ConfigManager.setQueryClient(myQueryClient);

const { data } = useQuery(getAccountFullQueryOptions('ecency'));
```

