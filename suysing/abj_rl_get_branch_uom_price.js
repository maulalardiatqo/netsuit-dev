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
 * @Script Name   :  - SSCC | RL | Get Item Branch UoM Price
 * @script File   :  abj_rl_get_branch_uom_price.js
 * @Trigger Type  :  Integration
 * @Release Date  :  Dec 31, 2025
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
        try{
            var pageSize = parseInt(requestParams.pageSize, 10);
            var pageIndex = parseInt(requestParams.pageIndex, 10);

            pageSize = (pageSize && pageSize > 0) ? pageSize : 10;
            pageIndex = (pageIndex && pageIndex >= 0) ? pageIndex : 0;

            var branchUomSearch = search.load({
                id: 'customsearchwebsite_item_branch_uom_get'
            });

            var pagedData = branchUomSearch.runPaged({
                pageSize: pageSize
            });
            var totalPages = pagedData.pageRanges.length;
            log.debug('totalPages', totalPages)

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
            var page = pagedData.fetch({
                index: pageIndex
            });
            var results = [];
            page.data.forEach(function (result) {
                var itemName = result.getValue({
                    name: 'itemid'
                });
                var location = result.getValue({
                    name: "location"
                });
                var primaryUnit = result.getValue({
                    name: 'unitstype'
                });
                var basePrice = result.getValue({
                    name: 'baseprice'
                });
                results.push({
                    itemName: itemName || '',
                    location: location || '',
                    primaryUnit: primaryUnit || '',
                    basePrice: basePrice || '',
                });
            });
            log.debug('results', results)
            var totalRes = pagedData.count
            log.debug('dataReturn', {
                pageSize : pageSize,
                pageIndex : pageIndex,
                totalPages : totalPages,
                totalRes : totalRes
            })
            return {
                status: 'SUCCESS',
                pageSize: pageSize,
                currentPage: pageIndex,
                totalPages: totalPages,
                totalResults: totalRes,
                results: results
            };
        }catch(ex){
            log.error("get: "+ex.name, ex.message);
            return {
                status: 'FAILED',
                name: ex.name,
                message: ex.message,
                stack: ex.stack
            };
        }            
    };

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