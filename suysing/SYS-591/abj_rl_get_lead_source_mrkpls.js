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
 * @Script Name   :  - SSCC | RL | MRKPLS | Get Lead Source 
 * @script File   :  abj_rl_get_lead_source_mrkpls.js
 * @Trigger Type  :  Integration
 * @Release Date  :  Feb 11, 2026
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
    function get(context) {
        try {
            log.debug("Request Params", context);
            if (!context.integration_type || !context.record_type) {
                throw error.create({
                    name: 'MISSING_PARAM',
                    message: 'integration_type and record_type is mandatory.'
                });
            }
            var configSearch = search.create({
                type: "customrecord_int_fld_restriction_holder",
                filters: [
                    ['custrecord_integration_source', 'is', context.integration_type],
                    "AND",
                    ['custrecord_rec_type', 'is', context.record_type] 
                ],
                columns: ['custrecord_flds_to_retrieve', 'custrecord1']
            });

            var configResult = configSearch.run().getRange({ start: 0, end: 1 });

            if (configResult.length === 0) {
                throw error.create({
                    name: 'CONFIG_NOT_FOUND',
                    message: 'config not found for: ' + context.integration_type + ' & Record: ' + context.record_type
                });
            }

            var req_fields = configResult[0].getValue('custrecord_flds_to_retrieve');
            var additionalFilterRaw = configResult[0].getValue('custrecord1'); 
            
            log.debug("Fields to retrieve", req_fields);

            var req_cols = req_fields.split(',');
            var _columns = [];

            req_cols.forEach(function(fieldRaw) {
                var f = fieldRaw.trim();
                if (f) {
                    if (f.indexOf('.') > -1) {
                        var parts = f.split('.');
                        _columns.push(search.createColumn({
                            join: parts[0],
                            name: parts[1]
                        }));
                    } else {
                        _columns.push(search.createColumn({
                            name: f
                        }));
                    }
                }
            });

            var searchFilters = []; 

            if (additionalFilterRaw) {
                try {
                    var parsedFilters = JSON.parse('[' + additionalFilterRaw + ']');
                    
                    parsedFilters.forEach(function(filter, index) {
                        if (index > 0) {
                            searchFilters.push("AND");
                        }
                        searchFilters.push(filter);
                    });
                } catch (e) {
                    log.error("FILTER_PARSE_ERROR", "Failed To Parsing custrecord1: " + additionalFilterRaw);
                }
            }
            
            log.debug('searchFilters Final', JSON.stringify(searchFilters));

            var dynamicSearch = search.create({
                type: context.record_type, 
                filters: searchFilters,
                columns: _columns
            });

            var pageSize = parseInt(context.pageSize, 10) || 10;
            var pageIndex = parseInt(context.pageIndex, 10) || 0;

            var pagedData = dynamicSearch.runPaged({
                pageSize: pageSize
            });

            var totalPages = pagedData.pageRanges.length;

            if (pageIndex >= totalPages && totalPages > 0) {
                return {
                    status: 'FAILED',
                    message: 'pageIndex out of range',
                    totalPages: totalPages
                };
            }

            var page = pagedData.fetch({ index: pageIndex });
            var results = [];

            page.data.forEach(function(row) {
                var rowData = {};
                _columns.forEach(function(col) {
                    var key = col.join ? (col.join + '_' + col.name) : col.name;
                    rowData[key] = row.getValue(col);
                });

                results.push(rowData);
            });

            return {
                status: 'SUCCESS',
                pageIndex: pageIndex,
                pageSize: pageSize,
                totalPages: totalPages,
                totalResults: pagedData.count,
                data: results 
            };

        } catch (ex) {
            log.error(ex.name, ex.message);
            return {
                status: 'FAILED',
                error_name: ex.name,
                message: ex.message
            };
        }
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