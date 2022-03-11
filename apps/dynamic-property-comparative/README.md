# Comparative Binding Evaluation 

Based on the conclusions from [Array Slice Property Data Binder](../array-slice-property-binder) and [Array Slice Property Data Binding](../array-slice-property-binding) investigation we believe is important to validate the scalability characteristics of the two categories of solutions. However this is NOT a exhaustive benchmark, but just an attempt to sketch the performance and scalability trend lines. Therefore the absolute value of the presented results is more or less irrelevant (as has to do a lot with the test heuristics). More meaningful is the ratio between the result values obtained in similar test conditions for `Path` and `Type Binding`

# Vocabulary

- Path Binding - refers to the ability to listen for _insert, modify, remove, etc._ Property DDS data changes __by registering absolute navigation paths__ via the [DataBinder](https://github.com/microsoft/FluidFramework/blob/main/experimental/PropertyDDS/packages/property-binder/src/data_binder/dataBinder.ts) interface.
- Type Binding - refers to the ability to listen for _insert, modify, remove, etc._ Property DDS data changes __by registering type specific [Data Binding](https://github.com/microsoft/FluidFramework/blob/main/experimental/PropertyDDS/packages/property-binder/src/data_binder/dataBinding.ts) artifacts__

# The Theory

The `Type Binding` strategy benefits from its minimal footprint. As the [ChangeSet](https://github.com/microsoft/FluidFramework/blob/main/experimental/PropertyDDS/packages/property-changeset/src/changeset.ts) carries information on the type definition 


## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
