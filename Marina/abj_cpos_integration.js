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
            function convertToDate(dateStr) {
                var parts = dateStr.split('/');
                var day = parseInt(parts[0], 10);
                var month = parseInt(parts[1], 10) - 1; // Month in JS Date starts from 0
                var year = parseInt(parts[2], 10);
                return new Date(year, month, day);
            }
            function getItemUpdate(context){
                const since = context.since;
                log.debug('since', since)
                if (!since) {
                    log.debug('masuk sini')
                    throw error.create({
                        name: 'MISSING_PARAM',
                        message: 'The "since" date parameter is required (format: YYYY-MM-DD).'
                    });
                }

                try {
                    var respons
                    log.debug('masuk try')
                    const transFilters = [
                        search.createFilter({ name: 'type', operator: 'anyof', values: ['InvAdjst', 'ItemRcpt', 'ItemShip', 'InvTrnfr'] }), 
                        search.createFilter({ name: 'trandate', operator: 'after', values: since })
                    ];
                    const transColumns = [
                        search.createColumn({ name: 'item', summary: 'GROUP' })
                    ];
                    const transSearch = search.create({
                        type: 'transaction',
                        filters: transFilters,
                        columns: transColumns
                    });
                    log.debug('transSearch', transSearch)
                    const itemIds = [];
                    const pagedData = transSearch.runPaged({ pageSize: 1000 });
                    pagedData.pageRanges.forEach((pageRange) => {
                        const page = pagedData.fetch({ index: pageRange.index });
                        page.data.forEach((result) => {
                            const itemId = result.getValue({ name: 'item', summary: 'GROUP' });
                            if (itemId) {
                                itemIds.push(itemId);
                            }
                        });
                    });
                    log.debug('itemIds', itemIds)
                    if (itemIds.length === 0) {
                        log.debug('masuk length 0')
                        respons = {
                            status: "success",
                            message: "no item data Found",
                        }
                        return JSON.stringify(respons)
                    }

                    const itemFilters = [
                        search.createFilter({ name: 'internalid', operator: 'anyof', values: itemIds }),
                        search.createFilter({ name: 'type', operator: 'anyof', values: ['InvtPart'] })
                    ];
                    const itemColumns = [
                        search.createColumn({ name: 'itemid', label: 'Item Name' }),
                        search.createColumn({ name: 'inventorylocation', label: 'Inventory Location ID' }),
                        search.createColumn({ name: 'name', join: 'inventorylocation', label: 'Inventory Location Name' }),
                        search.createColumn({ name: 'locationquantityonhand', label: 'Location On Hand' }) 
                    ];
                    const itemSearch = search.create({
                        type: 'inventoryitem',
                        filters: itemFilters,
                        columns: itemColumns
                    });
                    const updatedItems = {};
                    const itemPagedData = itemSearch.runPaged({ pageSize: 1000 });
                    log.debug('itemPagedData', itemPagedData)
                    itemPagedData.pageRanges.forEach((pageRange) => {
                        const page = itemPagedData.fetch({ index: pageRange.index });
                        log.debug('page', page)
                        page.data.forEach((result) => {
                            const itemId = result.id; // Internal ID of the item
                            const itemName = result.getValue('itemid');
                            const locId = result.getValue('inventorylocation');
                            const locName = result.getValue({ name: 'name', join: 'inventorylocation' });
                            const qty = parseFloat(result.getValue('locationquantityonhand')) || 0;

                            if (!updatedItems[itemId]) {
                                updatedItems[itemId] = {
                                    id: itemId,
                                    name: itemName,
                                    locations: []
                                };
                            }
                            if (locId) {
                                updatedItems[itemId].locations.push({
                                    locationId: locId,
                                    locationName: locName,
                                    quantity: qty
                                });
                            }
                        });
                    });
                    log.debug('-',Object.values(updatedItems) )
                    respons = {
                        status : "success",
                        data : updatedItems
                    }
                    return JSON.stringify(respons)
                } catch (e) {
                    log.debug('error', e)
                    return JSON.stringify(e);
                }
            }
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
                    let customerID = data.entity.internalId;
                    let transDate = data.transDate;
                    var dateObj = convertToDate(transDate);
                    log.debug('dateObj', dateObj)
                    let memo = data.memo;
                    let locationID = data.location.internalId;
                    let discountitemID = data.discountitemid;
                    let accountID = data.accountid;
                    let items = data.items;
                    log.debug("items", items);
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
                        fieldId: "trandate",
                        value: dateObj,
                        ignoreFieldChange: false,
                    });
                    dataRec.setValue({
                        fieldId: "memo",
                        value: 'test script bin',
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
                    for (var i = 0; i < items.length; i++) {
                        let itemID = data.items[i].itemid;
                        var itemName = ''
                        log.debug('itemID', itemID)
                        var isUseBin = false
                        if(itemID){
                            var itemSearchObj = search.create({
                                type: "item",
                                filters: [
                                    ["internalid","anyof",itemID]
                                ],
                                columns: [
                                    search.createColumn({ name: "itemid", label: "Name" }),
                                    search.createColumn({ name: "displayname", label: "Display Name" }),
                                    search.createColumn({ name: "isinactive", label: "Inactive" }),
                                    search.createColumn({name: "usebins", label: "Use Bins"}),
                                    search.createColumn({name: "type", label: "Type"}),
                                ]
                            });
                            var searchResultCount = itemSearchObj.runPaged().count;
                            log.debug("itemSearchObj result count", searchResultCount);
                            if(searchResultCount < 1){
                                log.debug('lebih kecil dari satu atau 0');
                                itemID = 45029
                            }else{
                                var results = itemSearchObj.run().getRange({ start: 0, end: 1 }); 
                                results.forEach(function (result) {
                                    log.debug("Item", result.getValue({ name: "itemid" }) + " - " + result.getValue({ name: "displayname" }));
                                    var isInactive = result.getValue({ name: "isinactive" });
                                    isUseBin = result.getValue({ name: "usebins" });
                                    log.debug('cek is usebins', isUseBin)
                                    itemName = result.getValue({ name: "itemid" }) + " - " + result.getValue({ name: "displayname" });
                                    var displayNameItem = result.getValue({ name: "displayname" });
                                    if(displayNameItem == ''){
                                        log.debug('displayNem item kosong')
                                        displayNameItem = result.getValue({name : 'itemid'})
                                    }
                                    var baserecordtype = result.getValue({name : 'type'})
                                    var typeRecord = ''
                                    if(baserecordtype == 'InvtPart'){
                                        typeRecord = 'inventoryitem'
                                    }else if(baserecordtype == 'NonInvtPart'){
                                        typeRecord = 'noninventoryitem'
                                    }else if(baserecordtype == 'Discount'){
                                        typeRecord = 'discountitem'
                                    }
                                    log.debug('baserecordtype', baserecordtype)
                                    if (isInactive === true || isInactive === 'T') {
                                        var savedId = record.submitFields({
                                            type: typeRecord,
                                            id: itemID,
                                            values: {
                                                'isinactive': false,
                                                'custitem_msa_locpos' : locationID,
                                                'displayname' : displayNameItem,
                                            }
                                        });
                                    
                                        log.debug('Item re-activated using submitFields, ID:', savedId);
                                    }
                                });
                            }
                            
                            
                            
                        }
                        
                        let quantity = data.items[i].quantity;
                        let allocatedBins = [];
                        log.debug('filter', {
                            itemID : itemID, locationID : locationID
                        })
                        log.debug('isUseBin', isUseBin)
                        if (isUseBin) {
                            var itemSearchObj = search.create({
                                type: "item",
                                filters: [
                                    ["internalid", "anyof", itemID], 
                                    "AND",
                                    ["binonhand.location", "anyof", locationID]
                                ],
                                columns: [
                                    search.createColumn({ name: "internalid", join: "binOnHand", sort: search.Sort.ASC }),
                                    search.createColumn({ name: "binnumber", join: "binOnHand", label: "Bin Number" }),
                                    search.createColumn({ name: "quantityavailable", join: "binOnHand", label: "Available" })
                                ]
                            });
                        
                            let searchResult = itemSearchObj.run();
                            let remainingQty = quantity;
                        
                            searchResult.each(function (result) {
                                if (remainingQty <= 0) return false; 
                        
                                let idBin = result.getValue({ name: "binnumber", join: "binOnHand" });
                                let qtyAvailable = parseInt(result.getValue({ name: "quantityavailable", join: "binOnHand" }), 10);
                        
                                if (qtyAvailable > 0) {
                                    let qtyToAllocate = Math.min(remainingQty, qtyAvailable);
                                    allocatedBins.push({ idBin, quantity: qtyToAllocate });
                                    remainingQty -= qtyToAllocate;
                                }
                        
                                return true;
                            });
                        }
                        
                        let rate = data.items[i].rate;
                        let amount = data.items[i].amount;
                        let taxCode = data.items[i].taxCode;
                        log.debug('taxCode', taxCode)
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
                            fieldId: "item",
                            value: itemID,
                        });
                        log.debug('itemName', itemName)
                        dataRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "description",
                            value: itemName,
                        });
                        dataRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "quantity",
                            value: quantity,
                        });
                        if(isUseBin){
                            let inventoryDetailSubrecord = dataRec.getCurrentSublistSubrecord({
                                sublistId: 'item',
                                fieldId: 'inventorydetail'
                            });
                            log.debug("Allocated Bins", JSON.stringify(allocatedBins));
                            
                            allocatedBins.forEach(bin => {
                                inventoryDetailSubrecord.selectNewLine({ sublistId: 'inventoryassignment' });
                                inventoryDetailSubrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'binnumber', value: bin.idBin });
                                inventoryDetailSubrecord.setCurrentSublistValue({ sublistId: 'inventoryassignment', fieldId: 'quantity', value: bin.quantity });
                                inventoryDetailSubrecord.commitLine({ sublistId: 'inventoryassignment' });
                            });
                        }
                        

                        log.debug('after set invassignment')
                        dataRec.setCurrentSublistValue({
                            sublistId: "item",
                            fieldId: "price",
                            value: "-1",
                        });
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
                        log.debug('after set taxcode')
                        dataRec.commitLine({
                            sublistId: "item",
                        });
                        log.debug('after commit')
                    }
                    dataRec.setValue({
                        fieldId : 'custbody_msa_response_body',
                        value : data
                    })
                    // var cashSaleID = 0
                     var cashSaleID = dataRec.save({
                        enableSourcing: true,
                        ignoreMandatoryFields: true,
                     });
                     if(cashSaleID){

                     }
                     log.debug('cashSaleID', cashSaleID)
                    var response = {
                        status: "success",
                        message: "data successfully " + action + " ",
                        internalid: cashSaleID,
                    };
                    // callCustRec(response, data, cashSaleID);
                    return JSON.stringify(response);
                    
                } catch (error) {
                    var response = {
                    status: "failed",
                    message: error,
                    };
                    log.debug("ERROR", "Error : " + error);
                    
                    callCustRec(response, data);
                    return JSON.stringify(response);
                }
            }
            function callCustRec(response, request, cashSaleID){
                log.debug('respons', response);
                log.debug('request', request);
                var recCreate = record.create({
                    type: "customrecord_abj_log_integration_pos",
                    isDynamic: true,
                });
                recCreate.setValue({
                    fieldId: "custrecord_log_integration_responsebody",
                    value : response
                })
                recCreate.setValue({
                    fieldId: "custrecord_log_integration_trx_number",
                    value : cashSaleID
                })
                recCreate.setValue({
                    fieldId: "custrecord_log_integration_job_message",
                    value : response.status
                })
                recCreate.setValue({
                    fieldId: "custrecord_log_integration_requestbody",
                    value : request
                })
                var recCustId = recCreate.save();
                log.debug('recCustId', recCustId)
            }  
            function doGet(requestParams) {
            try {
                var record_type = requestParams.record_type;
                var intID = requestParams.internalid;
                var start = requestParams.start;
                var end = requestParams.end;
                log.debug('record_type', record_type)
                if (record_type === "itemPrice") return getItemPrice(intID);
                else if (record_type === "bulkItemPrice") return getBulkItemPrice(start, end);
                else if (record_type === "itemData") return getItemUpdate(requestParams);
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
                log.debug('requestBody type', requestBody.type)
                log.debug('requestBody.data', requestBody.data)
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
        