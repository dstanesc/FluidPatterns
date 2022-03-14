# Comparative Binding Evaluation 

Based on the conclusions from [Array Slice Property Data Binder](../array-slice-property-binder) and [Array Slice Property Data Binding](../array-slice-property-binding) investigation we believe is important to validate the scalability characteristics of the two categories of solutions. However this is NOT a exhaustive benchmark, but just an attempt to sketch the performance and scalability trend lines. Therefore the absolute value of the presented results is more or less irrelevant (as has to do a lot with the test heuristics). More meaningful is the ratio between the result values obtained in similar test conditions for `Path` and `Type Binding`

# Vocabulary

- __Path Binding__ - refers to the ability to listen for _insert, modify, remove, etc._ Property DDS data changes __by registering absolute navigation paths__ via the [DataBinder](https://github.com/microsoft/FluidFramework/blob/main/experimental/PropertyDDS/packages/property-binder/src/data_binder/dataBinder.ts) interface.
- __Type Binding__ - refers to the ability to listen for _insert, modify, remove, etc._ Property DDS data changes __by registering type specific [Data Binding](https://github.com/microsoft/FluidFramework/blob/main/experimental/PropertyDDS/packages/property-binder/src/data_binder/dataBinding.ts) artifacts__

# The Theory

1. The `Type Binding` strategy is conceptually more I/O efficient. As the [Change Set](https://github.com/microsoft/FluidFramework/blob/main/experimental/PropertyDDS/packages/property-changeset/src/changeset.ts) operation structures (_insert, modify, remove, etc._) carry the `typeid` attribution, à la:
```json
{
 "modify": {
  "hex:dice-1.0.0": {
   "dice": {
    "Int32": {
     "diceValue": {
      "value": 135,
     }
    }
   }
  }
 }
}
```
dispatching them to the callbacks is a relatively inexpensive operation even with instances of the `dice` (ie. `hex:dice-1.0.0`) stored at many locations (1000s ?) in the property tree. On the other hand the `Path Binding` uses _absolute_ paths for performing the same selection. For every incoming modification, the collection of `_AbsolutePathDataBinding._registeredPaths` would have to be scanned to trigger the appropriate callbacks. 

2. The `Type Binding` strategy is conceptually more modular and helps creating maintainable applications. The association between data templates (ie. typed structs, eg.  `hex:dice-1.0.0`) and stable binding rules (ie. immutable at runtime) represent in our view a design choice super relevant in promoting consistency for data usage. For instance multiple bindings can be defined for a given data template and data consumers have the ability to choose among this stable set. This is for instance analogous to view specifications enabling generic applications to use consistent view definitions (eg. same collection of attributes) when consuming/displaying objects of a particular type for properly categorized use cases. This pattern is used successfully in other frameworks, for instance [SimManager](https://www.mscsoftware.com/product/simmanager) portal platform.

3. The `Path Binding` strategy shines for dynamic use-cases. For instance extracting a user specified slice of data in [Array Slice Property Data Binder](../array-slice-property-binder) exercise. While such cases are possible and should not be discouraged, the designer should always evaluate whether a `Type Binding` is not possible for the use-cases at hand. The exercise in the [Array Slice Property Data Binder](../array-slice-property-binder) could actually be solved with a set of static binding definitions. The example is simplistic, but useful to convey the idea: the goal to display only the first page of a given array of data can be also covered with discrete binding specs (eg. [0..10], [10..20], [20..30]) instead of a single & variable binding specification (eg. `defineBinding(startIndex, endIndex)`). In production code such pattern may represent an indicator of a less formal data or use-case model.




# The Evidence


## Disclaimer

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact
[opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

This project may contain Microsoft trademarks or logos for Microsoft projects, products, or services. Use of these
trademarks or logos must follow Microsoft’s [Trademark & Brand Guidelines](https://www.microsoft.com/trademarks). Use of
Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft
sponsorship.
