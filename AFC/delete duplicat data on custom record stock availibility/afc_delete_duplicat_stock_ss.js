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
        var allItem_list = [];
        var customrecord_abj_stock_onhandSearchObj = search.create({
          type: "customrecord_abj_stock_onhand",
          filters: [
            ["custrecord_abj_stock_onhand", "greaterthanorequalto", "0"]
          ],
          columns: [
            "internalid",
            "custrecord_abj_stock_item",
            "custrecord_abj_stock_displayname",
            "custrecord_abj_stock_itemtype",
            "custrecord_abj_stock_location",
            "custrecord_abj_stock_onhand"
          ]
        });
        var searchResultCount = customrecord_abj_stock_onhandSearchObj.runPaged().count;
        log.debug("customrecord_abj_stock_onhandSearchObj result count", searchResultCount);
        customrecord_abj_stock_onhandSearchObj.run().each(function(row) {
        let idItem = row.getValue({
            name : 'internalid'
        })
          let itemID = row.getValue({
            name: 'custrecord_abj_stock_item'
          });
          let itemName = row.getValue({
            name: 'custrecord_abj_stock_displayname'
          });
          let itemLoc = row.getValue({
            name: 'custrecord_abj_stock_location'
          });
          var itemQty = row.getValue({
            name: 'custrecord_abj_stock_onhand'
          });
          allItem_list.push({
            idItem : idItem,
            itemID: itemID,
            displayname: itemName,
            locationid: itemLoc,
            qtyOnHand: itemQty
          });
          return true;
        });
        log.debug('allItemLength', allItem_list.length);
        var duplicates = [];
        var uniqueItems = allItem_list.filter(function(item, index, self) {
          if (
            self.findIndex(
              (i) =>
                i.displayname === item.displayname && i.locationid === item.locationid
            ) !== index
          ) {
            duplicates.push(item);
            return false;
          }
          return true;
        });
        log.debug('Duplicate Items:', duplicates);
        log.debug('duplicates length', duplicates.length);
        if(duplicates.length > 0){
            duplicates.forEach(function(duplicate) {
                var itemIdDuplicates = duplicate.idItem
                log.debug('itemIdDuplicates', itemIdDuplicates)
          // Delete duplicate record using record ID
         var deleteRecord = record.delete({
            type: 'customrecord_abj_stock_onhand',
            id: itemIdDuplicates
          });
        });
        }
        

      } catch (e) {
        log.debug("Error in Delete Duplicat Item Availability", e.name + ' : ' + e.message);
        }
    }
    return {
      execute: execute
    };
  });