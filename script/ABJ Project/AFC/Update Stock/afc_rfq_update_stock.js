/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime'],
  function(search, record, email, runtime) {
    function execute(context) {
      var searchId = runtime.getCurrentScript().getParameter("custscriptupd_stock_search_id");
      var StartRange = runtime.getCurrentScript().getParameter("custscript_start_range");
      var EndRange = runtime.getCurrentScript().getParameter("custscript_end_data_range");
      log.debug("searchId", searchId);
      try {
        var item_list = [];
        var location_list = [];

        var dataitems = search.load({
          id: searchId
        }).run().getRange(StartRange, EndRange);

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
        for (i in dataitems) {
          item_list.push(dataitems[i].getValue({
            name: 'internalid'
          }));
          location_list.push(dataitems[i].getValue({
            name: 'inventorylocation'
          }));
        }
        location_list = remove_duplicates_in_list(location_list);
        item_list = remove_duplicates_in_list(item_list);
        var stockavail_checks = [];
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
          }).run().getRange(0, 1000);
        }

        dataitems.forEach(function(result) {
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
          for (var i in stockavail_checks) {
            var stockavail_check = stockavail_checks[i];
            var item_to_check = stockavail_check.getValue({
              name: 'custrecord_abj_stock_item'
            }) || '';
            var location_to_check = stockavail_check.getValue({
              name: 'custrecord_abj_stock_location'
            }) || '';
            if ((itemid == item_to_check) &&
              (locationid == location_to_check)) {
              log.debug('item_to_check', item_to_check);
              log.debug('location_to_check', location_to_check);
              stockavail_id = stockavail_check.getValue({
                name: 'internalid'
              });
              log.debug('stockavail_id', stockavail_id);
              break;
            }
          }

          var stockavailrecord;
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
          log.debug('itemtype', itemtype);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_itemtype',
            value: itemtype,
            ignoreFieldChange: true
          });

          var itemcategory = result.getValue({
            name: 'custitem_abj_item_category'
          });
          log.debug('itemcategory', itemcategory);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_itemcategory',
            value: itemcategory,
            ignoreFieldChange: true
          });

          var itemsubcategory = result.getValue({
            name: 'custrecord_abj_stock_itemsubcategory'
          });
          log.debug('itemsubcategory', itemsubcategory);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_itemsubcategory',
            value: itemsubcategory,
            ignoreFieldChange: true
          });

          var itemcolor = result.getValue({
            name: 'custitem_abj_item_color'
          });
          log.debug('itemcolor', itemcolor);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_color',
            value: itemcolor,
            ignoreFieldChange: true
          });

          var itemsize = result.getValue({
            name: 'custrecord_abj_stock_size'
          });
          log.debug('itemsize', itemsize);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_size',
            value: itemsize,
            ignoreFieldChange: true
          });

          var stock_line = result.getValue({
            name: 'custitem_abj_item_productline'
          });
          log.debug('stock_line', stock_line);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_line',
            value: stock_line,
            ignoreFieldChange: true
          });

          var stock_usage = result.getValue({
            name: 'custitem_abj_item_usage'
          });
          log.debug('stock_usage', stock_usage);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_usage',
            value: stock_usage,
            ignoreFieldChange: true
          });

          var stock_gender = result.getValue({
            name: 'custitem_abj_item_gender'
          });
          log.debug('stock_gender', stock_gender);
          stockavailrecord.setValue({
            fieldId: 'custrecord_abj_stock_gender',
            value: stock_gender,
            ignoreFieldChange: true
          });

          var item_brand = result.getValue({
            name: 'custitem_abj_item_brand'
          });
          log.debug('item_brand', item_brand);
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

          var stockavail_id = stockavailrecord.save({
            enableSourcing: false,
            ignoreMandatoryFields: true
          });
          log.debug("save record", stockavail_id);
          return true;
        });
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