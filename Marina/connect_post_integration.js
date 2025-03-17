/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/search", "N/record", "N/file", "N/https", "N/runtime", "N/format"], /**
  * @param {search} search
  * @param {record} record
  * @param {file} file
  * @param {https} https
  * @param {runtime} runtime
  */ function (search, record, file, https, runtime, format) {
   /**
    * Function called upon sending a GET request to the RESTlet.
    *
    * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
    * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
    * @since 2015.1
    */
 
   function getItemPrice(intID) {
     try {
       var filterData = [];
       var dataObject = {};
       var response = [];
       var priceData = [];
 
       var itemData = record.load({
         type: "inventoryitem",
         id: intID,
         isDynamic: false,
       });
       if (itemData) {
         let lastPurchasePrice = itemData.getValue("lastpurchaseprice");
         var sublistid = "recmachcustrecord_msa_priceqty_item_id";
         var lineTotal = itemData.getLineCount({
           sublistId: sublistid,
         });
         for (var i = 0; i < lineTotal; i++) {
           let idDetail =
             itemData.getSublistValue({
               sublistId: sublistid,
               fieldId: "id",
               line: i,
             }) || "";
           let limitVolume =
             itemData.getSublistValue({
               sublistId: sublistid,
               fieldId: "custrecord_msa_gpq_volume",
               line: i,
             }) || "";
           let price =
             itemData.getSublistValue({
               sublistId: sublistid,
               fieldId: "custrecord_msa_gpq_harga",
               line: i,
             }) || "";
           let profit =
             itemData.getSublistValue({
               sublistId: sublistid,
               fieldId: "custrecord_msa_gpq_profit_percent",
               line: i,
             }) || "";
           priceData.push({
             id: idDetail,
             limitVolume: limitVolume,
             price: price,
             profit: profit,
           });
         }
         dataObject = {
           iditem: intID,
           lastPurchasePrice: lastPurchasePrice,
           itemPrice: priceData,
         };
         var response = {
           status: "success",
           data: dataObject,
           message: `ok`,
         };
       } else {
         var response = {
           status: "failed",
           data: dataObject,
           message: `no item for internalid ${intID}`,
         };
       }
       return JSON.stringify(response);
     } catch (e) {
       return JSON.stringify(e);
     }
   }
 
   function getBulkItemPrice(start, end) {
     try {
       var response = {
         status: "success",
         data: [],
       };
       log.debug("bulk item", {
         start: start,
         end: end,
       });
       var priceDataSearch = search.load({
         id: "customsearch353",
       });
       var priceDataSet = priceDataSearch.run();
       priceDataSearch = priceDataSet.getRange(start, end);
       log.debug("priceDataSearch", priceDataSearch.length);
       priceDataSearch.forEach(function (result) {
         var internalID =
           result.getValue({
             name: priceDataSet.columns[0],
           }) || 0;
         var itemName =
           result.getValue({
             name: priceDataSet.columns[1],
           }) || "";
         var lastPurchasePrice =
           result.getValue({
             name: priceDataSet.columns[2],
           }) || 0;
         var itemData = {
           itemID: internalID,
           itemName: itemName,
           lastPurchasePrice: lastPurchasePrice,
           price: [],
         };
         var customrecord_msa_group_price_qtySearchObj = search.create({
           type: "customrecord_msa_group_price_qty",
           filters: [["custrecord_msa_priceqty_item_id", "anyof", internalID]],
           columns: ["custrecord_msa_gpq_volume", "custrecord_msa_gpq_harga", "custrecord_msa_gpq_profit_percent", "internalid"],
         });
         customrecord_msa_group_price_qtySearchObj.run().each(function (row) {
           var internalid = row.getValue("internalid");
           var volume = row.getValue("custrecord_msa_gpq_volume");
           var price = row.getValue("custrecord_msa_gpq_harga");
           var profit = row.getValue("custrecord_msa_gpq_profit_percent");
           itemData.price.push({
             id: internalid,
             limitVolume: volume,
             price: price,
             profit: profit,
           });
           return true;
         });
         response.data.push(itemData);
       });
       response.length = response.data.length;
       return JSON.stringify(response);
     } catch (e) {
       var errorResponse = {
         status: "error",
         message: e.toString(), // Log the error message
       };
       log.debug("Error occurred:", e);
       return JSON.stringify(errorResponse);
     }
   }
 
   function updateItem(data) {
     try {
       var sublistid = "recmachcustrecord_msa_priceqty_item_id";
       var internalID = data.internalid;
       var purchasePrice = data.purchasePrice;
       var itemData = record.load({
         type: "inventoryitem",
         id: internalID,
         isDynamic: false,
       });
       if (itemData) {
         itemData.setValue({
           fieldId: "cost",
           value: purchasePrice,
           ignoreFieldChange: false,
         });
         itemData.save();
         for (var i = 0; i < data.itemsData.length; i++) {
           let id = data.itemsData[i].id;
           let limitVolume = data.itemsData[i].limitVolume;
           let price = data.itemsData[i].price;
           let profit = data.itemsData[i].profit;
           log.debug("id", id);
           if (id) {
             var priceDataData = record.load({
               type: "customrecord_msa_group_price_qty",
               id: id,
               isDynamic: false,
             });
           } else {
             var priceDataData = record.create({
               type: "customrecord_msa_group_price_qty",
               isDynamic: false,
             });
           }
           priceDataData.setValue({
             fieldId: "custrecord_msa_priceqty_item_id",
             value: internalID,
             ignoreFieldChange: false,
           });
           priceDataData.setValue({
             fieldId: "custrecord_msa_gpq_volume",
             value: limitVolume,
             ignoreFieldChange: false,
           });
           priceDataData.setValue({
             fieldId: "custrecord_msa_gpq_harga",
             value: price,
             ignoreFieldChange: false,
           });
           priceDataData.setValue({
             fieldId: "custrecord_msa_gpq_profit_percent",
             value: parseFloat(profit),
             ignoreFieldChange: false,
           });
           priceDataData.save();
         }
         var response = {
           status: "success",
           message: "Data successfully updated",
         };
       } else {
         var response = {
           status: "failed",
           message: `no item for internalid ${intID}`,
         };
       }
       return JSON.stringify(response);
     } catch (error) {
       var response = {
         status: "failed",
         message: error,
       };
       log.debug("ERROR", "Error : " + error);
       return JSON.stringify(response);
     }
   }
 
   function postBulkItemPrice(data) {
     try {
       var internalID = data.internalid;
       log.debug("internalID", internalID);
       var response = {
         status: "success",
         data: [],
       };
       var priceDataSearch = search.load({
         id: "customsearch353",
       });
       priceDataSearch.filters.push(
         search.createFilter({
           name: "internalid",
           operator: search.Operator.ANYOF,
           values: internalID,
         })
       );
       var priceDataSet = priceDataSearch.run();
       priceDataSearch = priceDataSet.getRange(0, 1000);
       log.debug("priceDataSearch", priceDataSearch.length);
       priceDataSearch.forEach(function (result) {
         var internalID =
           result.getValue({
             name: priceDataSet.columns[0],
           }) || 0;
         var itemName =
           result.getValue({
             name: priceDataSet.columns[1],
           }) || "";
         var lastPurchasePrice =
           result.getValue({
             name: priceDataSet.columns[2],
           }) || 0;
         var itemData = {
           itemID: internalID,
           itemName: itemName,
           lastPurchasePrice: lastPurchasePrice,
           price: [],
         };
         var customrecord_msa_group_price_qtySearchObj = search.create({
           type: "customrecord_msa_group_price_qty",
           filters: [["custrecord_msa_priceqty_item_id", "anyof", internalID]],
           columns: ["custrecord_msa_gpq_volume", "custrecord_msa_gpq_harga", "custrecord_msa_gpq_profit_percent", "internalid"],
         });
         customrecord_msa_group_price_qtySearchObj.run().each(function (row) {
           var internalid = row.getValue("internalid");
           var volume = row.getValue("custrecord_msa_gpq_volume");
           var price = row.getValue("custrecord_msa_gpq_harga");
           var profit = row.getValue("custrecord_msa_gpq_profit_percent");
           itemData.price.push({
             id: internalid,
             limitVolume: volume,
             price: price,
             profit: profit,
           });
           return true;
         });
         response.data.push(itemData);
       });
       response.length = response.data.length;
       return JSON.stringify(response);
     } catch (error) {
       var response = {
         status: "failed",
         message: error,
       };
       log.debug("ERROR", "Error : " + error);
       return JSON.stringify(response);
     }
   }
 
   function postCashSale(data) {
     try {
       let internalID = data.internalid;
       let customerID = data.customerid;
       let memo = data.memo;
       let locationID = data.locationid;
       let discountitemID = data.discountitemid;
       let accountID = data.accountid;
       let items = data.items;
       log.debug("internalID", internalID);
       var dataRec;
       var action = "";
       if (internalID) {
         dataRec = record.load({
           type: "cashsale",
           id: internalID,
         });
         action = "updated";
       } else {
         dataRec = record.create({
           type: "cashsale",
           isDynamic: true,
         });
         action = "created";
       }
       dataRec.setValue({
         fieldId: "entity",
         value: customerID,
         ignoreFieldChange: false,
       });
       dataRec.setValue({
         fieldId: "memo",
         value: memo,
         ignoreFieldChange: false,
       });
       dataRec.setValue({
         fieldId: "location",
         value: locationID,
         ignoreFieldChange: false,
       });
       if (accountID) {
         dataRec.setValue({
           fieldId: "account",
           value: accountID,
           ignoreFieldChange: false,
         });
       }
       if (discountitemID) {
         dataRec.setValue({
           fieldId: "discountitem",
           value: discountitemID,
           ignoreFieldChange: false,
         });
       }
 
       log.debug("items.length", items.length);
       for (var i = 0; i < items.length; i++) {
         let itemID = data.items[i].itemid;
         let quantity = data.items[i].quantity;
         let rate = data.items[i].rate;
         let amount = data.items[i].amount;
         let taxCode = data.items[i].taxcode;
         if (internalID) {
           dataRec.selectLine({
             sublistId: "item",
             line: i,
           });
         } else {
           dataRec.insertLine({
             sublistId: "item",
             line: i,
           });
         }
         dataRec.setCurrentSublistValue({
           sublistId: "item",
           fieldId: "item",
           value: itemID,
         });
         dataRec.setCurrentSublistValue({
           sublistId: "item",
           fieldId: "quantity",
           value: quantity,
         });
         var searchItemLot = search.lookupFields({
           type: "item",
           id: itemID,
           columns: ["islotitem"],
         });
         var isLotItem = true;
         log.debug("searchItemLot", searchItemLot);
         if (searchItemLot) {
           isLotItem = searchItemLot.islotitem;
         }
         if (isLotItem) {
           // if item is lot number
           let subrecInvtrDetail = dataRec.getSublistSubrecord({
             sublistId: "item",
             fieldId: "inventorydetail",
             line: i,
           });
           var j = 0;
           var remainingQty = quantity;
           var inventorynumberSearchObj = search.create({
             type: "inventorynumber",
             filters: [["item.internalid", "anyof", itemID], "AND", ["location", "anyof", locationID], "AND", ["quantityavailable", "greaterthan", "0"]],
             columns: ["internalid", "inventorynumber", "item", "memo", "expirationdate", "location", "quantityonhand", "quantityavailable", "quantityonorder", "isonhand", "quantityintransit"],
           });
           inventorynumberSearchObj.run().each(function (result) {
             let inventoryDetailID = result.getValue("internalid");
             let inventoryDetailQTY = result.getValue("quantityavailable");
             log.debug("inventoryDetailQTY", inventoryDetailQTY);
             if (remainingQty >= inventoryDetailQTY) {
               subrecInvtrDetail.setCurrentSublistValue({
                 sublistId: "inventoryassignment",
                 fieldId: "issueinventorynumber",
                 value: inventoryDetailID,
                 line: j,
               });
               subrecInvtrDetail.setCurrentSublistValue({
                 sublistId: "inventoryassignment",
                 fieldId: "quantity",
                 value: inventoryDetailQTY,
               });
               subrecInvtrDetail.commitLine("inventoryassignment");
               j++;
               remainingQty -= inventoryDetailQTY;
               return false;
             } else {
               subrecInvtrDetail.setCurrentSublistValue({
                 sublistId: "inventoryassignment",
                 fieldId: "issueinventorynumber",
                 value: inventoryDetailID,
                 line: j,
               });
               subrecInvtrDetail.setCurrentSublistValue({
                 sublistId: "inventoryassignment",
                 fieldId: "quantity",
                 value: remainingQty,
               });
               subrecInvtrDetail.commitLine("inventoryassignment");
               j++;
               return true;
             }
           });
         }
         dataRec.setCurrentSublistValue({
           sublistId: "item",
           fieldId: "rate",
           value: rate,
         });
         dataRec.setCurrentSublistValue({
           sublistId: "item",
           fieldId: "amount",
           value: amount,
         });
         dataRec.setCurrentSublistValue({
           sublistId: "item",
           fieldId: "taxcode",
           value: taxCode,
         });
         dataRec.commitLine({
           sublistId: "item",
         });
       }
       var cashSaleID = dataRec.save({
         enableSourcing: true,
         ignoreMandatoryFields: true,
       });
       var response = {
         status: "success",
         message: "data successfully " + action + " ",
         internalid: cashSaleID,
       };
       return JSON.stringify(response);
     } catch (error) {
       var response = {
         status: "failed",
         message: error,
       };
       log.debug("ERROR", "Error : " + error);
       return JSON.stringify(response);
     }
   }
 
   function doGet(requestParams) {
     try {
       var record_type = requestParams.record_type;
       var intID = requestParams.internalid;
       var start = requestParams.start;
       var end = requestParams.end;
       if (record_type === "itemPrice") return getItemPrice(intID);
       else if (record_type === "bulkItemPrice") return getBulkItemPrice(start, end);
       else return JSON.stringify("No record type selected");
     } catch (e) {
       log.debug("Error Get Method : ", e);
     }
   }
 
   /**
    * Function called upon sending a PUT request to the RESTlet.
    * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
    * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
    * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
    * @since 2015.2
    */
   function doPut(requestBody) {}
 
   /**
    * Function called upon sending a POST request to the RESTlet.
    *
    * @param {string | Object} requestBody - The HTTP request body; request body will be passed into function as a string when request Content-Type is 'text/plain'
    * or parsed into an Object when request Content-Type is 'application/json' (in which case the body must be a valid JSON)
    * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
    * @since 2015.2
    */
   function doPost(requestBody) {
     if (requestBody.type === "updateItem") return updateItem(requestBody.data);
     else if (requestBody.type === "getBulkItemPrice") return postBulkItemPrice(requestBody.data);
     else if (requestBody.type === "createCashSale") return postCashSale(requestBody.data);
   }
 
   /**
    * Function called upon sending a DELETE request to the RESTlet.
    *
    * @param {Object} requestParams - Parameters from HTTP request URL; parameters will be passed into function as an Object (for all supported content types)
    * @returns {string | Object} HTTP response body; return string when request Content-Type is 'text/plain'; return Object when request Content-Type is 'application/json'
    * @since 2015.2
    */
   function doDelete(requestParams) {}
 
   return {
     get: doGet,
     put: doPut,
     post: doPost,
     delete: doDelete,
   };
 });
 