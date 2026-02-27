# Supported Frameworks on Vercel

## [Frameworks infrastructure support matrix](#frameworks-infrastructure-support-matrix)

The following table shows which features are supported by each framework on Vercel. The framework list is not exhaustive, but a representation of the most popular frameworks deployed on Vercel.

We're committed to having support for all Vercel features across frameworks, and continue to work with framework authors on adding support. _This table is continually updated over time_.

Supported

Not Supported

Not Applicable

| Feature                                                                                                                                                            | Next.js | SvelteKit | Nuxt | TanStack | Astro | Remix | Vite | CRA |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | --------- | ---- | -------- | ----- | ----- | ---- | --- |
| [Static Assets](/docs/cdn) Support for static assets being served and cached directly from the edge                                                                |         |           |      |          |       |       |      |     |
| [Edge Routing Rules](/docs/cdn#features) Lets you configure incoming requests, set headers, and cache responses                                                    |         |           |      |          |       |       |      |     |
| [Routing Middleware](/docs/routing-middleware) Execute code before a request is processed                                                                          |         |           |      |          |       |       |      |     |
| [Server-Side Rendering](/docs/functions) Render pages dynamically on the server                                                                                    |         |           |      |          |       |       |      |     |
| [Streaming SSR](/docs/functions/streaming-functions) Stream responses and render parts of the UI as they become ready                                              |         |           |      |          |       |       |      |     |
| [Incremental Static Regeneration](/docs/incremental-static-regeneration) Create or update content on your site without redeploying                                 |         |           |      |          |       |       |      |     |
| [Image Optimization](/docs/image-optimization) Optimize and cache images at the edge                                                                               |         |           |      |          |       |       |      |     |
| [Runtime Cache](/docs/runtime-cache) A granular cache for storing responses from fetches                                                                           |         |           |      |          |       |       |      |     |
| [Native OG Image Generation](/docs/og-image-generation) Generate dynamic open graph images using Vercel Functions                                                  |         |           |      |          |       |       |      |     |
| [Multi-runtime support (different routes)](/docs/functions/runtimes) Customize runtime environments per route                                                      |         |           |      |          |       |       |      |     |
| [Multi-runtime support (entire app)](/docs/functions/runtimes) Lets your whole application utilize different runtime environments                                  |         |           |      |          |       |       |      |     |
| [Output File Tracing](/kb/guide/how-can-i-use-files-in-serverless-functions) Analyzes build artifacts to identify and include only necessary files for the runtime |         |           |      |          |       |       |      |     |
| [Skew Protection](/docs/skew-protection) Ensure that only the latest deployment version serves your traffic by not serving older versions of code                  |         |           |      |          |       |       |      |     |
| [Framework Routing Middleware](/docs/routing-middleware) Framework-native integrated middleware convention                                                         |         |           |      |          |       |       |      |     |

## [All frameworks](#all-frameworks)

The frameworks listed below can be deployed to Vercel with minimal configuration. See [our docs on framework presets](/docs/deployments/configure-a-build#framework-preset) to learn more about configuration.

## [More resources](#more-resources)

Learn more about deploying your preferred framework on Vercel with the following resources:

*   [Next.js on Vercel](/docs/frameworks/nextjs)
*   [SvelteKit on Vercel](/docs/frameworks/sveltekit)
*   [Astro on Vercel](/docs/frameworks/astro)
*   [Nuxt on Vercel](/docs/frameworks/nuxt)