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
        var masterItemList = [];
        var masterSAList = [];

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

        function remove_duplicates_in_list(arr) {
          var uniques = [];
          var itemsFound = {};
          for (var i = 0, l = arr.length; i < l; i++) {
            var stringified = JSON.stringify(arr[i]);
            if (itemsFound[stringified]) {
              continue;
            }
            uniques.push(arr[i]);
            itemsFound[stringified] = true;
          }
          return uniques;
        }

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
          masterItemList.push({
            itemID: itemid,
            displayname: displayname,
            locationid: locationid,
            qtyOnHand: qtyOnHand
          });
          return true;
        });

        var customrecord_abj_stock_onhandSearchObj = search.create({
          type: "customrecord_abj_stock_onhand",
          filters: [
            ["custrecord_abj_stock_onhand", "greaterthanorequalto", "0"]
          ],
          columns: [
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
          masterSAList.push({
            itemID: itemID,
            displayname: itemName,
            locationid: itemLoc,
            qtyOnHand: itemQty
          });
          return true;
        });

        log.debug("masterSAList", masterSAList.length);
        log.debug("masterItemList", masterItemList.length);

        const differentQtyOnHandArray = [];

        masterItemList.forEach((itemmaster) => {
          const itemSAIndex = masterSAList.findIndex(
            (itemSA) => itemSA.displayname === itemmaster.displayname && itemSA.locationid === itemmaster.locationid
          );

          if (itemSAIndex !== -1) {
            const itemSA = masterSAList[itemSAIndex];
            if (itemSA.qtyOnHand !== itemmaster.qtyOnHand) {
              differentQtyOnHandArray.push({
                itemID: itemmaster.itemID,
                displayname: itemmaster.displayname,
                locationid: itemmaster.locationid,
                qtyOnHandArray1: itemmaster.qtyOnHand,
                qtyOnHandArray2: itemSA.qtyOnHand
              });
            }
            itemSA.qtyOnHand = itemmaster.qtyOnHand; // Update qtyOnHand in array2
          } else {
            differentQtyOnHandArray.push({
              itemID: itemmaster.itemID,
              displayname: itemmaster.displayname,
              locationid: itemmaster.locationid,
              qtyOnHandArray1: itemmaster.qtyOnHand,
              qtyOnHandArray2: null
            });
          }
        });

        log.debug("differentQtyOnHandArray", differentQtyOnHandArray);
        location_list = remove_duplicates_in_list(location_list);
        item_list = remove_duplicates_in_list(item_list);
        var stockavail_checks = [];
        // log.debug("location_list", {
        //   location_list: location_list,
        //   item_list: item_list
        // })
        // start command
        if ((item_list.length > 0) && (location_list.length > 0)) {
          stockavail_checks = search.create({
            type: 'customrecord_abj_stock_onhand',
            columns: ['internalid', 'custrecord_abj_stock_item', 'custrecord_abj_stock_location'],
            filters: [{
                name: 'custrecord_abj_stock_item',
                operator: 'anyof',
                values: item_list
              },
              {
                name: 'custrecord_abj_stock_location',
                operator: 'anyof',
                values: location_list
              },
            ]
          });
          var stockavail_checksSet = getAllResults(stockavail_checks);
        }
        
        resultSet.forEach(function(result) {
          var itemid = result.getValue({
            name: 'internalid'
          });
          var locationid = result.getValue({
            name: 'inventorylocation'
          });
          log.debug('Debug',
            'update item :' + itemid + ',Location: ' +
            locationid + ' to stock availability'
          );
        
          var stockavail_id = 0;
          stockavail_checksSet.forEach(function(result_cek) {
            var item_to_check = result_cek.getValue({
              name: 'custrecord_abj_stock_item'
            }) || '';
            var location_to_check = result_cek.getValue({
              name: 'custrecord_abj_stock_location'
            }) || '';
            if ((itemid == item_to_check) &&
              (locationid == location_to_check)) {
              // log.debug('item_to_check', item_to_check);
              // log.debug('location_to_check', location_to_check);
              stockavail_id = result_cek.getValue({
                name: 'internalid'
              });
              // log.debug('stockavail_id', stockavail_id);
            }
            return true;
          });
          
           var stockavailrecord;
          // log.debug("stockavail_id", stockavail_id)
          if (stockavail_id) {
            stockavailrecord = record.load({
              type: 'customrecord_abj_stock_onhand',
              id: stockavail_id,
              isDynamic: true
            });
          } else {
            stockavailrecord = record.create({
              type: 'customrecord_abj_stock_onhand',
              isDynamic: true
            });
          }
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_item',
            value: itemid,
            ignoreFieldChange: true
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_displayname',
            value: result.getValue({
              name: 'displayname'
            }),
            ignoreFieldChange: true
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_desc',
            value: result.getValue({
              name: 'purchasedescription'
            }),
            ignoreFieldChange: true
          });
          var itemtype = result.getValue({
            name: 'custitem_abj_item_type'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_itemtype',
            value: itemtype,
            ignoreFieldChange: true
          });
        
          var itemcategory = result.getValue({
            name: 'custitem_abj_item_category'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_itemcategory',
            value: itemcategory,
            ignoreFieldChange: true
          });
        
          var itemsubcategory = result.getValue({
            name: 'custrecord_abj_stock_itemsubcategory'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_itemsubcategory',
            value: itemsubcategory,
            ignoreFieldChange: true
          });
        
          var itemcolor = result.getValue({
            name: 'custitem_abj_item_color'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_color',
            value: itemcolor,
            ignoreFieldChange: true
          });
        
          var itemsize = result.getValue({
            name: 'custrecord_abj_stock_size'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_size',
            value: itemsize,
            ignoreFieldChange: true
          });
        
          var stock_line = result.getValue({
            name: 'custitem_abj_item_productline'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_line',
            value: stock_line,
            ignoreFieldChange: true
          });
        
          var stock_usage = result.getValue({
            name: 'custitem_abj_item_usage'
          });
          
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_usage',
            value: stock_usage,
            ignoreFieldChange: true
          });
        
          var stock_gender = result.getValue({
            name: 'custitem_abj_item_gender'
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_gender',
            value: stock_gender,
            ignoreFieldChange: true
          });
        
          var item_brand = result.getValue({
            name: 'custitem_abj_item_brand'
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_brand',
            value: item_brand,
            ignoreFieldChange: true
          });
        
          var item_year = result.getValue({
            name: 'custitem_abj_item_year'
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_year',
            value: item_year,
            ignoreFieldChange: true
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_location',
            value: locationid,
            ignoreFieldChange: true
          });
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_onhand',
            value: result.getValue({
              name: 'locationquantityonhand'
            }),
            ignoreFieldChange: true
          });
        // log.debug('detail item', {
        //   itemid : itemid, itemsize : itemsize, item_brand: item_brand, stock_gender: stock_gender, stock_usage : stock_usage, itemsubcategory : itemsubcategory, itemcolor : itemcolor
        // })
          var stockavail_id = stockavailrecord.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });
          log.debug("save record", stockavail_id);
          return true;
        });
        // end command
        var scriptObj = runtime.getCurrentScript();
        log.debug({
          title: "Remaining usage units: ",
          details: scriptObj.getRemainingUsage()
        });

      } catch (e) {
        log.debug("Error in Update Item Availability", e.name + ' : ' + e.message);
        /*var subject = 'Fatal Error: Unable to transform salesorder to item fulfillment!';
        var authorId = -5;
        var recipientEmail = 'notify@example.com';
        email.send({
            author: authorId,
            recipients: recipientEmail,
            subject: subject,
            body: 'Fatal error occurred in script: ' + runtime.getCurrentScript().id + '\n\n' + JSON.stringify(e)
        });*/
      }
    }
    return {
      execute: execute
    };
  });