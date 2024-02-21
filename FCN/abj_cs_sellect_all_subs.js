/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
    var records = currentRecord.get();
    function pageInit(context) {
        console.log('init masuk')
    }
    // function fieldChanged(context) {
    //     var vrecord = context.currentRecord;
    //     var fieldName = context.fieldId;
    //     if(fieldName == 'custentity_vendor_all'){
    //         var isAllSub = vrecord.getValue({
    //             fieldId : 'custentity_vendor_all'
    //         });
    //         console.log('isAllSub', isAllSub)
    //         if(isAllSub == true){
    //             console.log('true')
    //             var allIdSub = [];
    //             var subsidiarySearchObj = search.create({
    //                 type: "subsidiary",
    //                 filters:
    //                 [
    //                 ],
    //                 columns:
    //                 [
    //                     search.createColumn({name: "internalid", label: "Internal ID"}),
    //                     search.createColumn({name: "legalname", label: "Legal Name"})
    //                 ]
    //             });
    //             var searchResultCount = subsidiarySearchObj.runPaged().count;
    //             log.debug("subsidiarySearchObj result count",searchResultCount);
    //             subsidiarySearchObj.run().each(function(result){
    //                 var internalIdSub = result.getValue({
    //                     name : 'internalid'
    //                 })
    //                 if(internalIdSub){
    //                     allIdSub.push(internalIdSub);
    //                 }
    //             return true;
    //             });
    //             var idAlready = [];
    //             var subCount = vrecord.getLineCount({
    //                 sublistId: 'submachine'
    //             });
    //             if(subCount > 0){
    //                 for(var index = 0; index < subCount; index++ ){
    //                     // vrecord.removeLine({
    //                     //     sublistId: 'submachine',
    //                     //     line: index
    //                     // });
    //                     var idSub = vrecord.getSublistValue({
    //                         sublistId : 'submachine',
    //                         fieldId : 'subsidiary',
    //                         line : index
    //                     });
    //                     idAlready.push(idSub)
    //                 }
    //             }
    //             console.log('allIdSUbbef', allIdSub)
    //             var filteredIdSub = allIdSub.filter(function(id) {
    //                 return !idAlready.includes(id);
    //             });
                
    //             allIdSub = filteredIdSub;
    //             console.log('allIdSubAft', allIdSub)
    //             // allIdSub.forEach(data=>{
    //             //     var subsidiaryId = data.
    //             //     vrecord.selectNewLine({
    //             //         sublistId: "submachine"
    //             //     });
    //             //     vrecord.setCurrentSublistValue({
    //             //         sublistId:"submachine",
    //             //         fieldId:"subsidiary",
    //             //         value: data
    //             //     });
    //             //     vrecord.commitLine({sublistId : 'submachine'})
    //             // })
    //             for (var i = 0; i < allIdSub.length; i++) {
    //                 vrecord.selectNewLine({
    //                     sublistId: 'submachine'
    //                 });
                
    //                 vrecord.setCurrentSublistValue({
    //                     sublistId: 'submachine',
    //                     fieldId: 'subsidiary', 
    //                     value: allIdSub[i]
    //                 });
                
    //                 vrecord.commitLine({
    //                     sublistId: 'submachine'
    //                 });
    //             }

    //         }

    //     }
    // }
    return {
        pageInit: pageInit,
        // fieldChanged: fieldChanged,
    };
});