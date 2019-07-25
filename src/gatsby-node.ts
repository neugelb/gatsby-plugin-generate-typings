import { ParentSpanPluginArgs, PluginOptions, PluginCallback } from "gatsby";
// import { loadDocuments } from 'graphql-toolkit';
import { codegen } from "@graphql-codegen/core";
import * as fs from "fs-extra";
// import * as glob from 'glob';

import { plugin as typescriptPlugin } from "@graphql-codegen/typescript";
import { plugin as operationsPlugin } from "@graphql-codegen/typescript-operations";

import { IntrospectionQuery } from "graphql";
const {
  introspectionQuery,
  graphql,
  buildClientSchema,
  parse,
  printSchema
} = require("gatsby/graphql");

const path = require("path");

const defaultLocation = path.resolve(process.cwd(), "graphql-types.d.ts");

exports.onPostBootstrap = async (
  args: ParentSpanPluginArgs,
  options: PluginOptions = { plugins: [] },
  callback?: PluginCallback
) => {
  const { store, reporter } = args;
  const dest: string = (options.dest as string) || defaultLocation;

  // get the schema and load all graphql queries from pages
  const { schema } = store.getState();

  // automatic typings for queries disabled atm
  // const { schema, program } = store.getState();
  // const { directory } = program;
  // const docFiles: String[] = [];
  // docFiles.push(
  //  ...glob
  //    .sync('./src/**/*.{ts,tsx}', {})
  //    .filter(fileName => fileName.indexOf('.test') < 0)
  // );
  // docFiles.push(
  //  ...glob
  //    .sync('./.cache/fragments/*.js', {})
  //    .filter(fileName => fileName.indexOf('.test') < 0)
  // );

  // const docPromises = docFiles.map(async docGlob => {
  //  const _docGlob = path.join(directory, docGlob);
  //  try {
  //    const doc = await loadDocuments(_docGlob, {});
  //    return doc;
  //  } catch (e) {
  //    reporter.error('error when trying to parse schema, ignoring', e);
  //    return Promise.resolve([]);
  //  }
  // });
  // const results = await Promise.all(docPromises);
  // const documents = results.reduce((acc, cur) => acc.concat(cur), []);

  const res = await graphql(schema, introspectionQuery);
  const introspectSchema = res.data as IntrospectionQuery;
  const parsedSchema = parse(printSchema(buildClientSchema(introspectSchema)));

  // generate typings from schema
  const config = {
    // documents,
    documents: [],
    config: {},
    filename: dest,
    schema: parsedSchema,
    pluginMap: {
      typescript: {
        plugin: typescriptPlugin
      },
      typescriptOperation: {
        plugin: operationsPlugin
      }
    },
    plugins: [
      {
        typescript: {
          skipTypename: true,
          enumsAsTypes: true
        }
      } as any,
      {
        typescriptOperation: {
          skipTypename: true
        }
      } as any
    ]
  };

  const output = await codegen(config);

  // write the typings
  fs.outputFileSync(dest, output);

  reporter.info(`[gatsby-plugin-generate-typings] Wrote typings to ${dest}`);

  // tell gatsby we are done
  callback && callback(null);
};
