import { ParentSpanPluginArgs, PluginOptions, PluginCallback } from 'gatsby';
import { loadDocuments } from 'graphql-toolkit';
import { codegen } from '@graphql-codegen/core';
import * as fs from 'fs-extra';

import { plugin as typescriptPlugin } from '@graphql-codegen/typescript';
import { plugin as operationsPlugin } from '@graphql-codegen/typescript-operations';

import { IntrospectionQuery } from 'graphql';
const {
  introspectionQuery,
  graphql,
  buildClientSchema,
  parse,
  printSchema,
} = require('gatsby/graphql');

const path = require('path');

const defaultLocation = path.resolve(process.cwd(), 'graphql-types.d.ts');

exports.onPostBootstrap = async (
  args: ParentSpanPluginArgs,
  options: PluginOptions = { plugins: [] },
  callback?: PluginCallback
) => {
  const { store, reporter } = args;
  const dest: string = (options.dest as string) || defaultLocation;

  // get the schema and load all graphql queries from pages
  const { schema, program } = store.getState();
  const { directory } = program;

  const docPromises = ['./src/**/*.{ts,tsx}', './.cache/fragments/*.js'].map(
    docGlob => {
      const _docGlob = path.join(directory, docGlob);
      return loadDocuments(_docGlob);
    }
  );
  const results = await Promise.all(docPromises);
  const documents = results.reduce((acc, cur) => acc.concat(cur), []);

  const res = await graphql(schema, introspectionQuery);
  const introspectSchema = res.data as IntrospectionQuery;
  const parsedSchema = parse(printSchema(buildClientSchema(introspectSchema)));

  // generate typings from schema
  const config = {
    documents,
    config: {},
    filename: dest,
    schema: parsedSchema,
    pluginMap: {
      typescript: {
        plugin: typescriptPlugin,
      },
      typescriptOperation: {
        plugin: operationsPlugin,
      },
    },
    plugins: [
      {
        typescript: {
          skipTypename: true,
          enumsAsTypes: true,
        },
      } as any,
      {
        typescriptOperation: {
          skipTypename: true,
        },
      } as any,
    ],
  };

  const output = await codegen(config);

  // write the typings
  fs.outputFileSync(dest, output);

  reporter.info(`[gatsby-plugin-generate-typings] Wrote typings to ${dest}`);
};
