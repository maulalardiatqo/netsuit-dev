/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function(search, record, email, runtime) {
    function execute(context) {
      try {
        var item_list = [];
        var location_list = [];
        var allDataItems = [];
        var allDataGRF = [];

        function getAllResults(s) {
            var results = s.run();
            var searchResults = [];
            var searchid = 0;
            do {
              var resultslice = results.getRange({
                start: searchid,
                end: searchid + 1000
              });
              resultslice.forEach(function(slice) {
                searchResults.push(slice);
                searchid++;
              });
            } while (resultslice.length >= 1000);
            return searchResults;
          }

        var dataitems = search.create({
            type: "inventoryitem",
            filters: [
              ["type", "anyof", "InvtPart"],
              "AND",
              ["locationquantityonhand", "greaterthanorequalto", "0"]
            ],
            columns: [
              "internalid",
              "displayname",
              "purchasedescription",
              "custitem_abj_item_type",
              "custitem_abj_item_category",
              "custitem_abj_item_subcategory",
              "custitem_abj_item_color",
              "custitem_abj_item_size",
              "custitem_abj_item_productline",
              "custitem_abj_item_usage",
              "custitem_abj_item_gender",
              "custitem_abj_item_brand",
              "custitem_abj_item_year",
              "inventorylocation",
              "locationquantityonhand",
              search.createColumn({
                name: "custrecord_abj_locn_dept",
                join: "inventoryLocation"
              })
            ]
          });
          var searchResultCount = dataitems.runPaged().count;
          log.debug("inventoryitemSearchObj result count", searchResultCount);
          var resultSet = getAllResults(dataitems);
          resultSet.forEach(function(row) {
            var itemid = row.getValue({
              name: 'internalid'
            });
            var displayname = row.getValue({
              name: 'displayname'
            });
            var locationid = row.getValue({
              name: 'inventorylocation'
            });
            let qtyOnHand = row.getValue({
              name: 'locationquantityonhand'
            });
            item_list.push(itemid);
            location_list.push(locationid);
            allDataItems.push({
              itemID: itemid,
              displayname: displayname,
              locationid: locationid,
              qtyOnHand: qtyOnHand
            });
            return true;
          });
          var dataGRF = search.create({
            type: "customrecord_abj_grf",
            columns : [
                "internalid",
                "custrecord_abj_grf_location"
            ]
          });
          var searchResultCount = dataGRF.runPaged().count;
          log.debug("dataGRF count", searchResultCount);
          dataGRF.run().each(function(row) {
            var internalIdGRF = row.getValue({
                name : "internalid",
            });
            var locationGRF = row.getValue({
                name : "custrecord_abj_grf_location"
            });
            allDataGRF.push({
                internalIdGRF : internalIdGRF,
                locationGRF : locationGRF
            });
            return true;
          });
          
        //   log.debug('dataGRF', allDataGRF);

          // Loop 
            var dataGRFarray = [];
            for (var i = 0; i < allDataGRF.length; i++) {
                var internalIdGRF = allDataGRF[i].internalIdGRF;
                var locationGRF = allDataGRF[i].locationGRF ;
                var grfRecord = record.load({
                type: 'customrecord_abj_grf',
                id: internalIdGRF
                });
                var lineCount = grfRecord.getLineCount({
                sublistId: 'recmachcustrecord_abj_grf_header'
                });
                for (var line = 0; line < lineCount; line++) {
                    var itemDisplay = grfRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_abj_grf_header',
                        fieldId: 'custrecord_abj_grf_item_display',
                        line: line
                    });
                    var stockOnHand = grfRecord.getSublistValue({
                        sublistId: 'recmachcustrecord_abj_grf_header',
                        fieldId: 'custrecord_abj_location_onhand',
                        line: line
                    });
                    log.debug('details', {internalIdGRF : internalIdGRF, locationGRF : locationGRF, itemDisplay : itemDisplay, stockOnHand : stockOnHand});
                    dataGRFarray.push({
                        internalIdGRF : internalIdGRF,
                        locationGRF : locationGRF,
                        itemDisplay : itemDisplay,
                        stockOnHand : stockOnHand
                    });
                }
                
            }
            log.debug('dataGRFArray length', dataGRFarray.length);
            var dataForUpdate = [];
            dataGRFarray.forEach((itemGRF) => {
                const itemMasterIndex = allDataItems.findIndex(
                    (masteritem) => itemGRF.itemDisplay === masteritem.displayname && itemGRF.locationGRF === masteritem.locationid
                );
                if (itemMasterIndex !== -1) {
                    const itemMaster = allDataItems[itemMasterIndex];
                    dataForUpdate.push({
                        internalIdGRF : itemGRF.internalIdGRF,
                        itemDisplay: itemMaster.itemDisplay,
                        locationid: itemMaster.locationid,
                        qtyOnHand: itemMaster.qtyOnHand,
                    });
                }
            })
            log.debug('dataForupdate length', dataForUpdate.length);
            log.debug('data for update', dataForUpdate);
            if(dataForUpdate.length > 0){
                for (let i = 0; i < dataForUpdate.length; i++) {
                    const grfId = dataForUpdate[i].internalIdGRF;
                    var qtyOnHand = dataForUpdate[i].qtyOnHand
                    
                    const grfRecord = record.load({
                      type: 'customrecord_abj_grf',
                      id: grfId
                    });
                    const lineCount = grfRecord.getLineCount({ sublistId: 'recmachcustrecord_abj_grf_header' });
                    log.debug('lineCOunt', lineCount);
                    for (let line = 0; line < lineCount; line++) {
                        grfRecord.setSublistValue({
                            sublistId: 'recmachcustrecord_abj_grf_header',
                            fieldId: 'custrecord_abj_location_onhand',
                            line: line,
                            value: qtyOnHand
                        });
                    }
                    const recordId = grfRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    log.debug('recordID', recordId);
                }
            }
            
          } catch (e) {
            log.debug("Error in Delete Duplicate Item Availability", e.name + ' : ' + e.message);
          }
        }
    
        return {
          execute: execute
        }
    });