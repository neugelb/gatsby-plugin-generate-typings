## Description

This plugin uses `graphql-codegen` to automatically generate typings for the gatsby graphql schema and your graphql queries.

## How to install

using yarn: `yarn add gatsby-plugin-generate-typings`
in your gatsby-config.js add

```
    {
      // automatically generate typings from graphql schema
      resolve: 'gatsby-plugin-generate-typings',
      options: {
        dest: './src/generated/graphql-types.d.ts',
      },
    },
```

to automatically generate `./src/generated/graphql-types.d.ts`.

## Available options

`dest`: the destination file name, where the typings will be written to.

## When do I use this plugin?

When using `gatsby-plugin-typescript` it comes handy to have typings for your graphql schema and queries.

## Examples of usage

When installed as above you can do

```
import { SiteTitleQueryQuery } from '../generated/graphql-types';

// ... somewhere in your render() function:

<StaticQuery
    query={graphql`
      query SiteTitleQuery {
        site {
          siteMetadata {
            title
          }
        }
      }
    `}
    render={(data: SiteTitleQueryQuery) => {

      // can use data.site.siteMetadata and have full Typescript Typings for it

    }}
  />
```
