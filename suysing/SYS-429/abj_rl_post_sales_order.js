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
 * @script File   :  abj_rl_sales_order_api.js
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
        let response = {
            status: "failed",
            message: "",
            data: []
        };

        try {
            log.debug('GET Request Received', requestParams);

            let filters = [];
            // Filter by Date Range if provided
            if (requestParams.start_date && requestParams.end_date) {
                filters.push(['trandate', 'within', requestParams.start_date, requestParams.end_date]);
            }

            // Filter by Specific Sales Order ID (TranID / Order #)
            if (requestParams.sales_order_id) {
                if (filters.length > 0) filters.push('AND');
                filters.push(['tranid', 'is', requestParams.sales_order_id]);
            }

            // Essential Filter: Main Line is False to get lines, but we need to be careful to group them
            // Strategy: Search Main Line = False to get everything, then process in memory to group by Header.
            if (filters.length > 0) filters.push('AND');
            filters.push(['mainline', 'is', 'F']);
            if (filters.length > 0) filters.push('AND');
            filters.push(['taxline', 'is', 'F']);
            if (filters.length > 0) filters.push('AND');
            filters.push(['shipping', 'is', 'F']);

            // Columns Mapping based on 
            let columns = [
                search.createColumn({ name: 'internalid', sort: search.Sort.ASC }), // Used for grouping
                search.createColumn({ name: 'entity' }), // Client Name Source
                search.createColumn({ name: 'externalid', join: 'customer' }), // reference_id (Customer External ID)
                search.createColumn({ name: 'tranid' }), // sales_order_id
                search.createColumn({ name: 'entityid', join: 'customer' }), // account_code (Cust ID)
                search.createColumn({ name: 'custbody_abj_ttype' }), // transaction_type
                search.createColumn({ name: 'location' }), // branch_code
                search.createColumn({ name: 'custbody_abj_payment_mode' }), // payment_mode
                search.createColumn({ name: 'custbody_abj_remarks' }), // remarks
                search.createColumn({ name: 'status' }), // order_status
                search.createColumn({ name: 'trandate' }), // created_at
                search.createColumn({ name: 'lastmodifieddate' }), // updated_at
                
                // Line Details
                search.createColumn({ name: 'item' }), // item_code (ID)
                search.createColumn({ name: 'itemid', join: 'item' }), // item_code (Name)
                search.createColumn({ name: 'units' }), // item_uom
                search.createColumn({ name: 'location', join: 'item' }), // item_location (from item master? or line location?) - Source 3 says line.location
                search.createColumn({ name: 'location' }), // line location
                search.createColumn({ name: 'quantity' }), // ordered_quantity
                search.createColumn({ name: 'quantityshiprecv' }) // served_quantity (fulfilled)
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

            // Process results into nested JSON
            let groupedData = {};

            searchResults.forEach((result) => {
                let internalId = result.getValue('internalid');

                if (!groupedData[internalId]) {
                    // Create Header Object
                    groupedData[internalId] = {
                        client_name: result.getText('entity'),
                        reference_id: result.getValue({ name: 'externalid', join: 'customer' }),
                        sales_order_id: result.getValue('tranid'),
                        account_code: result.getValue({ name: 'entityid', join: 'customer' }),
                        transaction_type: result.getText('custbody_abj_ttype'),
                        branch_code: result.getText('location'),
                        payment_mode: result.getText('custbody_abj_payment_mode'),
                        remarks: result.getValue('custbody_abj_remarks'),
                        order_status: result.getText('status'),
                        created_at: result.getValue('trandate'),
                        updated_at: result.getValue('lastmodifieddate'),
                        order_details: []
                    };
                }

                // Add Line Detail
                groupedData[internalId].order_details.push({
                    item_code: result.getValue({ name: 'itemid', join: 'item' }),
                    item_uom: result.getText('units'),
                    item_location: result.getText('location'), // Line location
                    ordered_quantity: result.getValue('quantity'),
                    served_quantity: result.getValue('quantityshiprecv') || 0
                });
            });

            response.data = Object.values(groupedData);
            response.status = "success";
            response.message = "Data retrieved successfully";

        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            response.status = "failed";
            response.message = ex.message;
        }

        return response;
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

            // 2. CREATE RECORD
            let soRecord = record.create({
                type: record.Type.SALES_ORDER,
                isDynamic: true
            });

            // 3. SET HEADER FIELDS 
            soRecord.setValue({ fieldId: 'entity', value: customerId });
            soRecord.setValue({ fieldId: 'entity.externalid', value: requestBody.reference_id }); // Optional: Ensure consistency
            
            // account_code -> custbody_abj_custid
            if (requestBody.account_code) soRecord.setValue({ fieldId: 'custbody_abj_custid', value: requestBody.account_code });
            
            // transaction_type -> custbody_abj_ttype (Assuming input is ID, otherwise needs lookup)
            if (requestBody.transaction_type) soRecord.setValue({ fieldId: 'custbody_abj_ttype', value: requestBody.transaction_type });

            // branch_code -> location
            if (requestBody.branch_code) {
                 // Assuming input is Internal ID. If input is Name, use a helper to find ID.
                 // For now, setting value directly assuming ID or exact mapping.
                 soRecord.setValue({ fieldId: 'location', value: requestBody.branch_code });
            }

            // payment_mode -> custbody_abj_payment_mode
            if (requestBody.payment_mode) soRecord.setValue({ fieldId: 'custbody_abj_payment_mode', value: requestBody.payment_mode });

            // remarks -> custbody_abj_remarks
            if (requestBody.remarks) soRecord.setValue({ fieldId: 'custbody_abj_remarks', value: requestBody.remarks });


            // 4. SET LINE ITEMS 
            if (requestBody.sales_order_details && Array.isArray(requestBody.sales_order_details)) {
                
                requestBody.sales_order_details.forEach((line, index) => {
                    soRecord.selectNewLine({ sublistId: 'item' });

                    // Item Lookup: Map item_code (Name) to Internal ID
                    let itemId = getInternalIdByName('item', line.item_code);
                    if (!itemId) {
                        throw error.create({ name: 'INVALID_ITEM', message: `Item code ${line.item_code} not found at line ${index + 1}` });
                    }
                    soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'item', value: itemId });

                    // Quantity
                    if (line.ordered_quantity) {
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', value: line.ordered_quantity });
                    }

                    // Location (Line Level)
                    if (line.location) {
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'location', value: line.location });
                    }
                    
                    // UOM - Assuming input is the Internal ID of the UOM. 
                    // If input is text (e.g., "Box"), a lookup similar to Item is needed.
                    if (line.item_uom) {
                        // Note: Setting units often requires the item to be set first.
                        soRecord.setCurrentSublistValue({ sublistId: 'item', fieldId: 'units', value: line.item_uom });
                    }

                    soRecord.commitLine({ sublistId: 'item' });
                });
            }

            // 5. SAVE RECORD
            let recordId = soRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit('Sales Order Created', 'ID: ' + recordId);

            // Retrieve the tranid (Sales Order ID) of the created record for the response
            let tranId = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: recordId,
                columns: ['tranid']
            }).tranid;

            response.status = "success";
            response.message = "Record created successfully";
            // Per requirements output, explicit sales_order_id return isn't in JSON example , 
            // but standard REST practices usually return the ID. I will adhere to the prompt's source 24-27 format
            // but add data block if needed. Source 24 just says status and message.
            // However, Source 3 implies output reference_id and sales_order_ids. I will add them to be safe.
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
            filters: [['externalid', 'is', externalId]],
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