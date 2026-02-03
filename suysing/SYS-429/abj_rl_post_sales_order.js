/***************************************************************************************
 ** Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 ** A‑33‑01, Menara UOA Bangsar, 5 Jalan Bangsar Utama 1, Bangsar, 59000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur, Malaysia
 ** All Rights Reserved.
 ** This software is the confidential and proprietary information of ABJ Cloud Solutions. ("Confidential Information").
 ** You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement you entered into with ABJ Cloud Solutions.
 ***************************************************************************************/

/*******************************************************************************
 * **Copyright (c) 2025 ABJ Cloud Solutions, Inc.
 * @Client        :  Suy Sing
 * @Script Name   :  - SSCC | RL | Sales Order Integration
 * @script File   :  abj_rl_pos_get_so.js
 * @Trigger Type  :  External Request
 * @Release Date  :  JAN 22, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  RestLet to handle Creation (POST) and Retrieval (GET) of Sales Orders based on external JSON specifications.
 * @Enhancement   :
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/error', 'N/log'], (record, search, format, error, log) => {

    /**
     * GET method - Used to retrieve information about a specific record.
     * Retrieves Sales Orders based on Date Range or Sales Order ID (TranID).
     *
     * @param {Object} requestParams - { start_date, end_date, sales_order_id }
     * @returns {Object} - JSON object matching the requested output format.
     */
    function get(requestParams) {
        try {
            log.debug('GET Request Received', requestParams);

            let filters = [];
            if (requestParams.start_date && requestParams.end_date) {
                filters.push(['trandate', 'within', requestParams.start_date, requestParams.end_date]);
            }
            if (requestParams.sales_order_id) {
                if (filters.length > 0) filters.push('AND');
                filters.push(['internalid', 'is', requestParams.sales_order_id]);
            }
            if (filters.length > 0) filters.push('AND');
            filters.push(['mainline', 'is', 'F']);
            if (filters.length > 0) filters.push('AND');
            filters.push(['taxline', 'is', 'F']);
            if (filters.length > 0) filters.push('AND');
            filters.push(['shipping', 'is', 'F']);

            let columns = [
                search.createColumn({ name: 'internalid', sort: search.Sort.ASC }),
                search.createColumn({ name: 'entity' }), 
                search.createColumn({ name: 'tranid' }), 
                search.createColumn({ name: 'entityid', join: 'customer' }), 
                search.createColumn({ name: 'custbody_abj_ttype' }), 
                search.createColumn({ name: 'location' }), 
                search.createColumn({ name: 'custbody_abj_payment_mode' }), 
                search.createColumn({ name: 'custbody_abj_remarks' }), 
                search.createColumn({ name: 'status' }), 
                search.createColumn({ name: 'trandate' }), 
                search.createColumn({ name: 'lastmodifieddate' }), 
                search.createColumn({ name: 'item'}), 
                search.createColumn({ name: 'itemid', join: 'item' }),
                search.createColumn({ name: 'unitstype', join: 'item' }), 
                search.createColumn({ name: 'location', join: 'item' }), 
                search.createColumn({ name: 'quantity' }), 
                search.createColumn({ name: 'quantityshiprecv'}) 
            ];

            let soSearch = search.create({
                type: search.Type.SALES_ORDER,
                filters: filters,
                columns: columns
            });

            let searchResults = [];
            let pagedData = soSearch.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(function(pageRange) {
                let page = pagedData.fetch({ index: pageRange.index });
                searchResults = searchResults.concat(page.data);
            });
            let groupedData = {};
           searchResults.forEach(function(result) {
            var internalId = result.getValue('internalid');

            if (!groupedData[internalId]) {
                groupedData[internalId] = {
                    // Gunakan getText untuk nama, getValue untuk ID
                    client_name: result.getText('entity') || "", 
                    reference_id: result.getValue({ name: 'externalid', join: 'customer' }) || null,
                    sales_order_id: result.getValue('tranid') || "",
                    account_code: result.getValue({ name: 'entityid', join: 'customer' }) || "",
                    transaction_type: result.getText('custbody_abj_ttype') || "",
                    branch_code: result.getText('location') || "",
                    payment_mode: result.getText('custbody_abj_payment_mode') || "",
                    remarks: (result.getValue('custbody_abj_remarks') || "").toString().replace(/[\r\n]/g, " "),
                    order_status: result.getText('status') || "",
                    created_at: result.getValue('trandate') || "",
                    updated_at: result.getValue('lastmodifieddate') || "",
                    order_details: []
                };
            }
            groupedData[internalId].order_details.push({
                item_code: result.getValue({ name: 'itemid', join: 'item' }) || "",
                item_uom: result.getText({ name: 'unitstype', join: 'item' }) || "",
                item_location: result.getText('location') || "",
                ordered_quantity: result.getValue('quantity') || "0",
                served_quantity: result.getValue('quantityshiprecv') || "0"
            });
        });

        var resultData = Object.values(groupedData);

        // KUNCI: Gunakan JSON.parse(JSON.stringify()) untuk memutus 
        // semua referensi object internal NetSuite sebelum dikirim.
        var cleanObject = JSON.parse(JSON.stringify(resultData));

            return {
                status: "success",
                message: "Data retrieved successfully",
                data: cleanObject
            };
        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            return {
                status: "failed", 
                error_code: ex.name,    
                message: ex.message
            };
        }
    }

    /**
     * POST method - Used to create a new Sales Order record.
     * Maps external JSON fields to NetSuite fields based on specifications.
     *
     * @param {Object} requestBody - JSON object containing SO Header and Details.
     * @returns {Object} - JSON object with status and new record ID.
     */
    function post(requestBody) {
        let response = {
            status: "failed",
            message: ""
        };

        try {
            log.debug('POST Request Body', requestBody);

            if (!requestBody.reference_id) {
                throw error.create({ name: 'MISSING_REQ_PARAM', message: 'reference_id is required to identify the client.' });
            }
            let customerId = getInternalIdByExternalId('customer', requestBody.reference_id);
            if (!customerId) {
                throw error.create({ name: 'INVALID_CLIENT', message: 'Client not found for reference_id: ' + requestBody.reference_id });
            }
            let soRecord = record.create({
                type: record.Type.SALES_ORDER,
                isDynamic: true
            });
            soRecord.setValue({ fieldId: 'entity', value: customerId });
            soRecord.setValue({ fieldId: 'entity.externalid', value: requestBody.reference_id }); 
            if (requestBody.account_code) soRecord.setValue({ fieldId: 'custbody_abj_custid', value: requestBody.account_code });
            if (requestBody.transaction_type) soRecord.setValue({ fieldId: 'custbody_abj_ttype', value: requestBody.transaction_type });

            if (requestBody.branch_code) {
                 soRecord.setValue({ fieldId: 'location', value: requestBody.branch_code });
            }
            if (requestBody.payment_mode) soRecord.setValue({ fieldId: 'custbody_abj_payment_mode', value: requestBody.payment_mode });

            if (requestBody.remarks) soRecord.setValue({ fieldId: 'custbody_abj_remarks', value: requestBody.remarks });

            if (requestBody.sales_order_details && Array.isArray(requestBody.sales_order_details)) {
                
                requestBody.sales_order_details.forEach((line, index) => {
                    soRecord.selectNewLine({ sublistId: 'item' });

                    let itemId = line.item_code;
                    if (!itemId) {
                        throw error.create({ name: 'INVALID_ITEM', message: `Item code ${line.item_code} not found at line ${index + 1}` });
                    }
                    soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemId });
                    if (line.location) {
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: line.location });
                    }
                    
                    if (line.item_uom) {
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: line.item_uom });
                    }
                    if (line.ordered_quantity) {
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: line.ordered_quantity });
                    }
                    if(line.amount){
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'price', value: '-1' }); 
                        
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'rate', value: line.amount });

                    }

                    // Debugging value sebelum commit
                    var cekAmt = soRecord.getCurrentSublistValue({
                        sublistId : 'item',
                        fieldId : 'amount'
                    });
                    log.debug('cekAmt line ' + index, cekAmt);

                    soRecord.commitLine({ sublistId: 'item' });
    

                });
            }
            let recordId = soRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit('Sales Order Created', 'ID: ' + recordId);
            let tranId = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: recordId,
                columns: ['tranid']
            }).tranid;

            response.status = "success";
            response.message = "Record created successfully";
            response.sales_order_id = tranId;
            response.internal_id = recordId;

        } catch (ex) {
            log.error("post: " + ex.name, ex.message);
            response.status = "failed";
            response.message = ex.message;
        }

        return response;
    }

    /**
     * PUT method - Not required by current scope but kept for template structure.
     */
    function put(requestBody) {
        return { status: "error", message: "PUT method not implemented" };
    }

    /**
     * DELETE method - Not required by current scope but kept for template structure.
     */
    function deleteRecord(requestParams) {
        return { status: "error", message: "DELETE method not implemented" };
    }

    // --- HELPER FUNCTIONS ---

    /**
     * Helper to find Internal ID of a record by its External ID.
     */
    function getInternalIdByExternalId(recordType, externalId) {
        let resultId = null;
        search.create({
            type: recordType,
            filters: [['entityid', 'is', externalId]],
            columns: ['internalid']
        }).run().each(function(result) {
            resultId = result.id;
            return false;
        });
        return resultId;
    }

    /**
     * Helper to find Internal ID of a record by its Name (ItemID/EntityID).
     */
    function getInternalIdByName(recordType, nameVal) {
        let resultId = null;
        let filterField = (recordType === 'item') ? 'itemid' : 'entityid';
        
        search.create({
            type: recordType,
            filters: [[filterField, 'is', nameVal]],
            columns: ['internalid']
        }).run().each(function(result) {
            resultId = result.id;
            return false;
        });
        return resultId;
    }

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});