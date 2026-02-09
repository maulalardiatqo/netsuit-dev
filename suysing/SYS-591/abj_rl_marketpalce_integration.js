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
 * @Script Name   :  - SSCC | RL | Mrketplace Integration
 * @script File   :  abj_rl_marketplace_integration.js
 * @Trigger Type  :  Integration
 * @Release Date  :  Jan 2, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  <same as script description>
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/log'], (record, search, log) => {

    /**
    * GET method - Used to retrieve information about a specific record.
    * For this example, it retrieves a sales order by its internal ID.
    *
    * @param {Object} requestParams - An object containing the URL parameters.
    * e.g., /app/site/hosting/restlet.nl?script=xxx&deploy=xxx&id=123
    * @returns {Object} - A JSON object representing the sales order data.
    * @since 2015.2
    */
   function get(requestParams) {
        try {
            // pagination (logic lama dipertahankan)
            var pageSize = parseInt(requestParams.pageSize, 10);
            var pageIndex = parseInt(requestParams.pageIndex, 10);

            pageSize = (pageSize && pageSize > 0) ? pageSize : 10;
            pageIndex = (pageIndex && pageIndex >= 0) ? pageIndex : 0;

            var integrationSource = requestParams.integrationSource;
            if (!integrationSource) {
                throw new Error('integrationSource is required');
            }

            // 1. ambil config berdasarkan integrationSource
            var config = getRestrictionConfig(integrationSource);

            // 2. mapping record type
            var nsRecordType = mapRecordType(config.recordType);

            // 3. build columns
            var columns = buildColumns(config.fields);

            // 4. build filters (optional)
            var filters = buildFilters(config.additionalParam);

            // 5. create search
            var dynamicSearch = search.create({
                type: nsRecordType,
                filters: filters,
                columns: columns
            });

            var pagedData = dynamicSearch.runPaged({
                pageSize: pageSize
            });

            var totalPages = pagedData.pageRanges.length;

            if (pageIndex >= totalPages && totalPages > 0) {
                return {
                    status: 'FAILED',
                    message: 'pageIndex out of range',
                    pageSize: pageSize,
                    currentPage: pageIndex,
                    totalPages: totalPages,
                    totalResults: pagedData.count,
                    results: []
                };
            }

            var page = pagedData.fetch({ index: pageIndex });
            var results = [];

            page.data.forEach(function (result) {
                results.push(extractResult(result, config.fields));
            });

            return {
                status: 'SUCCESS',
                pageSize: pageSize,
                currentPage: pageIndex,
                totalPages: totalPages,
                totalResults: pagedData.count,
                results: results
            };

        } catch (ex) {
            log.error('GET ERROR', ex);
            return {
                status: 'FAILED',
                name: ex.name,
                message: ex.message,
                stack: ex.stack
            };
        }
    }

    /* =========================
     * CONFIG LOOKUP
     * ========================= */
    function getRestrictionConfig(integrationSource) {
        var srch = search.create({
            type: 'customrecord_int_fld_restriction_holder',
            filters: [
                ['custrecord_integration_source', 'is', integrationSource]
            ],
            columns: [
                'custrecord_rec_type',
                'custrecord_flds_to_retrieve',
                'custrecord1'
            ]
        });

        var res = srch.run().getRange({ start: 0, end: 1 });
        if (!res || !res.length) {
            throw new Error('No configuration found for integrationSource: ' + integrationSource);
        }

        return {
            recordType: res[0].getValue('custrecord_rec_type'),
            fields: res[0].getValue('custrecord_flds_to_retrieve'),
            additionalParam: res[0].getValue('custrecord1')
        };
    }

    /* =========================
     * RECORD TYPE MAP
     * ========================= */
    function mapRecordType(recType) {
        var map = {
            branch: search.Type.LOCATION,
            item: search.Type.ITEM,
            customer: search.Type.CUSTOMER
            // tambah jika perlu
        };

        if (!map[recType]) {
            throw new Error('Unsupported record type: ' + recType);
        }
        return map[recType];
    }

    /* =========================
     * COLUMN BUILDER
     * ========================= */
    function buildColumns(fieldList) {
        return fieldList.split(',').map(function (field) {
            field = field.trim();
            if (field.indexOf('.') > -1) {
                var parts = field.split('.');
                return search.createColumn({
                    join: parts[0],
                    name: parts[1]
                });
            }
            return search.createColumn({ name: field });
        });
    }

    /* =========================
     * FILTER BUILDER (optional)
     * ========================= */
    function buildFilters(additionalParam) {
        if (!additionalParam) return [];

        try {
            var parsed = JSON.parse(additionalParam);
            return parsed.filters || [];
        } catch (e) {
            log.debug('Invalid custrecord1 JSON, ignored', additionalParam);
            return [];
        }
    }

    /* =========================
     * RESULT EXTRACTOR
     * ========================= */
    function extractResult(result, fieldList) {
        var obj = {};
        fieldList.split(',').forEach(function (field) {
            field = field.trim();
            var val;
            if (field.indexOf('.') > -1) {
                var parts = field.split('.');
                val = result.getValue({
                    join: parts[0],
                    name: parts[1]
                });
            } else {
                val = result.getValue({ name: field });
            }
            obj[field] = val || '';
        });
        return obj;
    }



    /**
     * POST method - Used to create a new record.
     * For this example, it creates a new sales order.
     *
     * @param {Object} requestBody - A JSON object from the request body.
     * e.g., { "entity": "123", "items": [{"item": "456", "quantity": 10}]}
     * @returns {Object} - A JSON object with the new record's internal ID.
     * @since 2015.2
     */
    function post(requestBody) {
        try{

        }catch(ex){
            log.error("post: "+ex.name, ex.message);
        }
    };

    /**
     * PUT method - Used to update an existing record.
     * For this example, it updates a sales order's memo field and adds a new item.
     *
     * @param {Object} requestBody - A JSON object from the request body.
     * e.g., { "id": "123", "memo": "Updated memo", "item": {"item": "789", "quantity": 5}}
     * @returns {Object} - A JSON object with the updated record's internal ID.
     * @since 2015.2
     */
    function put(requestBody) {
        try{

        }catch(ex){
            log.error("put: "+ex.name, ex.message);
        }
    };

    /**
     * DELETE method - Used to delete a record.
     * For this example, it deletes a sales order by its internal ID.
     *
     * @param {Object} requestParams - An object containing the URL parameters.
     * e.g., /app/site/hosting/restlet.nl?script=xxx&deploy=xxx&id=123
     * @returns {Object} - A success message.
     * @since 2015.2
     */
    function deleteRecord(requestParams) {
        try{

        }catch(ex){
            log.error("deleteRecord: "+ex.name, ex.message);
        }
    };

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});