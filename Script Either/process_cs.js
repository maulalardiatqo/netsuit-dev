/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

define(["N/runtime", "N/log", "N/url", "N/currentRecord", "N/currency", "N/record", "N/search", "N/ui/message"], function (runtime, log, url, currentRecord, currency, record, search, message) {
  var records = currentRecord.get();
  function pageInit(context) {
    console.log('masuk')
  }

  function fieldChanged(context) {
    var vrecord = context.currentRecord;
    var sublistFieldName = context.fieldId;
    var sublistName = context.sublistId;
    if(context.fieldId == 'custrecord184'){
      console.log('subsidiary change');
      var subsiDiaryVal = vrecord.getValue({
        fieldId: 'custrecord184',
      });
      console.log('subsidiarVal', subsiDiaryVal)
    }
    let totalRate = 0;
    if (sublistName == "recmachcustrecord194") {
      if (sublistFieldName == "custrecord197") {
        console.log('add CHange')
        let lineTotal = records.getLineCount({
          sublistId: "recmachcustrecord188",
        });
        for (let i = 0; i < lineTotal; i++) {
          let rate = records.getSublistValue({
            sublistId: "recmachcustrecord188",
            fieldId: "custrecord193",
            line: i,
          });
          totalRate += parseFloat(rate);
        }
        console.log("total rate", totalRate);
        let percentage =
          records.getCurrentSublistValue({
            sublistId: "recmachcustrecord194",
            fieldId: "custrecord197",
          }) || 0;
        console.log("percentage", percentage);
        let estCost = totalRate * (percentage / 100);
        console.log("estCost", estCost);
        records.setCurrentSublistValue({
          sublistId: "recmachcustrecord194",
          fieldId: "custrecord200",
          value: estCost,
        });
      }
    }

    if (sublistName == "recmachcustrecord188") {
      var subsiDiaryVal = vrecord.getValue({
        fieldId: 'custrecord184',
      });
      if(subsiDiaryVal == '16'){
        if(sublistFieldName == "custrecord189"){
          console.log('itemchange');
          let lineTotal = records.getLineCount({
            sublistId: "recmachcustrecord188",
          });
          console.log('linetotal', lineTotal);
            for (let i = 0; i < lineTotal || i === 0; i++) {
              console.log('line', i);
              let item = records.getCurrentSublistValue({
                sublistId: "recmachcustrecord188",
                fieldId: "custrecord189",
                line: i,
              });
              console.log('item', item);
              var inventorydetailSearchObj = search.create({
                type: "inventorynumber",
                filters: [
                    ["internalid", "is", item],
                ],
                columns: [
                    "quantityavailable", "location"
                ],
            });

            var searchInventorydetailSet = inventorydetailSearchObj.run();
            var inventorydetailSearchResult = searchInventorydetailSet.getRange({
                start: 0,
                end: 1,
            });
            if (inventorydetailSearchResult.length > 0) {
              var locationInProcess = records.getCurrentSublistValue({
                  sublistId: "recmachcustrecord188",
                  fieldId: "custrecord203",
                  line: i,
              })
              var recInv = inventorydetailSearchResult[0];
              var qtyAvailable = recInv.getValue({
                  name: 'quantityavailable',
              });
              console.log('qtyAvailability', qtyAvailable);
              var location = recInv.getValue({
                name : 'location'
              });
              var locationText = recInv.getText({
                name:'location'
              })
              // if(locationInProcess != location){
              //   console.log('location diff')
              //   alert("the location you selected is not suitable, the lot number is at " + locationText );
              //     records.setCurrentSublistValue({
              //         sublistId: "recmachcustrecord188",
              //         fieldId: "custrecord203",
              //         line: i,
              //         value: location,
              //     });
                
              // }
              // console.log('location', location);
              // records.setCurrentSublistValue({
              //     sublistId: "recmachcustrecord188",
              //     fieldId: "custrecord218",
              //     line: i,
              //     value: qtyAvailable,
              // });
            }

          }
          
        }
      }else{
        if (sublistFieldName == "custrecord216") {
          let lineTotal = records.getLineCount({
              sublistId: "recmachcustrecord188",
          });
          console.log('linetotal', lineTotal);
            for (let i = 0; i < lineTotal || i === 0; i++) {
              console.log('line', i);

                let serialLot = records.getCurrentSublistValue({
                    sublistId: "recmachcustrecord188",
                    fieldId: "custrecord216",
                    line: i,
                });
  
                console.log('serialLot', serialLot);
  
                if (serialLot) {
                    var inventorydetailSearchObj = search.create({
                        type: "inventorynumber",
                        filters: [
                            ["internalid", "is", serialLot],
                        ],
                        columns: [
                            "quantityavailable", "location"
                        ],
                    });
  
                    var searchInventorydetailSet = inventorydetailSearchObj.run();
                    var inventorydetailSearchResult = searchInventorydetailSet.getRange({
                        start: 0,
                        end: 1,
                    });
  
                    if (inventorydetailSearchResult.length > 0) {
                        var locationInProcess = records.getCurrentSublistValue({
                          sublistId: "recmachcustrecord188",
                          fieldId: "custrecord203",
                          line: i,
                        })
                        var recInv = inventorydetailSearchResult[0];
                        var qtyAvailable = recInv.getValue({
                            name: 'quantityavailable',
                        });
                        console.log('qtyAvailability', qtyAvailable);
                        var location = recInv.getValue({
                          name : 'location'
                        });
                        var locationText = recInv.getText({
                          name:'location'
                        })
                        if(locationInProcess != location){
                          console.log('location diff')
                          alert("the location you selected is not suitable, the lot number is at " + locationText );
                            records.setCurrentSublistValue({
                                sublistId: "recmachcustrecord188",
                                fieldId: "custrecord203",
                                line: i,
                                value: location,
                            });
                          
                        }
                        console.log('location', location);
                        records.setCurrentSublistValue({
                            sublistId: "recmachcustrecord188",
                            fieldId: "custrecord218",
                            line: i,
                            value: qtyAvailable,
                        });
                      //   records.setCurrentSublistValue({
                      //     sublistId: "recmachcustrecord188",
                      //     fieldId: "custrecord203",
                      //     line: i,
                      //     value: location,
                      // });
                    }
                }
            
          }
          
      }
      }
      
      

      if (sublistFieldName == "custrecord191") {
        console.log('change');
        let lineTotal = records.getLineCount({
            sublistId: "recmachcustrecord188",
        });
    
        for (let i = 0; i < lineTotal || i === 0; i++) {
            let qtyOnhand = records.getCurrentSublistValue({
                sublistId: "recmachcustrecord188",
                fieldId: "custrecord218",
                line: i,
            });
            console.log('qtyonhand', qtyOnhand);
            let enteredQty = records.getCurrentSublistValue({
                sublistId: "recmachcustrecord188",
                fieldId: "custrecord191",
                line: i,
            });
            console.log('enterQty', enteredQty);
            if (enteredQty > qtyOnhand) {
                alert("Entered quantity is greater than onhand quantity!");
                records.setCurrentSublistValue({
                    sublistId: "recmachcustrecord188",
                    fieldId: "custrecord191",
                    line: i,
                    value: qtyOnhand,
                });
            }
        }
    }
  }
    
  }

  return {
    pageInit: pageInit,
    fieldChanged: fieldChanged,
  };
});
