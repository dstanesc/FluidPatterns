# FluidFramework - Fluid Patterns

Main focus is investigating the experimental Property DDS and related FluidFramework software patterns


# Getting Started

Needed dependencies
```
$ node --version
v16.13.1

$ npm --version
8.1.2
```

```
npm run clean
npm install --legacy-peer-deps
npm run build
```

# Apps

## Data Binding Patterns

- [Simple Property Binding](./apps/simple-property-binding/) 
- [Array Property Binding](./apps/array-property-binding/)
- [Array Slice Property Binding](./apps/array-slice-property-binding/) 
- [Array Slice Property Binder](./apps/array-slice-property-binder/) 
- [Comparative Binding Evaluation](./apps/dynamic-property-comparative/) 

## Materialized View Support

>Note: Work in progress

Main documentation [page](./apps/comment-materialized-experiment/README.md)

### Packages

- [Container Nameservice Agent](./apps/comment-nameservice-agent/)
- [Comment Plexus Agent](./apps/comment-materialized-agent/)
- [Comment Materialized Experiment](./apps/comment-materialized-experiment/)
- [Comment Materialized Search](./apps/comment-materialized-search/)

## Schema Patterns

## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
