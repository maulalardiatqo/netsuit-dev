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
 * @Script Name   :  SSCC | RL | Account Contacts Integration
 * @script File   :  abj_rl_account_contacts.js
 * @Trigger Type  :  External Request
 * @Release Date  :  JAN 20, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  Restlet to handle creation (POST) and retrieval (GET) of Account Contacts custom records.
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/error'], (record, search, format, error) => {
    const CONFIG = {
        REC_TYPE: 'customrecord_abj_cont',
        FIELDS: {
            FIRST_NAME: 'custrecord_abj_cont_confirname',
            LAST_NAME: 'custrecord_abj_cont_contlasname',
            ROLE: 'custrecord_abj_cont_role',
            CONTACT_TYPE: 'custrecord_abj_cont_contacttype',
            CONTACT_NUM: 'custrecord_abj_cont_contnum',
            CUSTOMER_LINK: 'custrecord_abj_cont_leadcust',
            IS_INACTIVE: 'isinactive',
            LAST_MODIFIED: 'lastmodified',
            CONTACT_GROUP: 'custrecord_abj_cont_contactgrp'
        }
    };
    const sendResponse = (status, message, data = null) => {
        let response = {
            status: status,
            message: message
        };
        if (data) {
            response.data = data;
        }
        return response;
    };
    const getCustomerInternalId = (entityId) => {
        if (!entityId) return null;
        let customerSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: [['entityid', 'is', entityId]],
            columns: ['internalid']
        });
        let result = customerSearch.run().getRange({ start: 0, end: 1 });
        return (result && result.length > 0) ? result[0].getValue('internalid') : null;
    };

    /**
     * GET method - Used to retrieve information about specific records.
     * Retrieves Account Contacts based on date filters and account_id.
     *
     * @param {Object} requestParams
     * @returns {Object} 
     */
    function get(requestParams) {
        try {
            log.debug('GET Request', requestParams);

            let startDateStr = requestParams.start_date;
            let endDateStr = requestParams.end_date;
            let accountId = requestParams.account_id;

            let filters = [];
            if (!startDateStr) {
                filters.push(search.createFilter({
                    name: CONFIG.FIELDS.IS_INACTIVE,
                    operator: search.Operator.IS,
                    values: false
                }));
            } else {
                let startDate = format.parse({ value: startDateStr, type: format.Type.DATE }); // Assuming YYYY-MM-DD or system format
                let endDate;

                if (!endDateStr) {
                    endDate = new Date(); 
                } else {
                    endDate = format.parse({ value: endDateStr, type: format.Type.DATE });
                }
                if (endDate < startDate) {
                    return sendResponse('error', 'end_date cannot be earlier than start_date');
                }
                let formattedStart = format.format({ value: startDate, type: format.Type.DATETIME });
                let formattedEnd = format.format({ value: endDate, type: format.Type.DATETIME });

                filters.push(search.createFilter({
                    name: CONFIG.FIELDS.LAST_MODIFIED,
                    operator: search.Operator.WITHIN,
                    values: [formattedStart, formattedEnd]
                }));
            }
            if (accountId) {
                let customerId = getCustomerInternalId(accountId);
                if (customerId) {
                    filters.push(search.createFilter({
                        name: CONFIG.FIELDS.CUSTOMER_LINK,
                        operator: search.Operator.ANYOF,
                        values: customerId
                    }));
                } else {
                    return sendResponse('success', 'Data retrieved successfully', []);
                }
            }
            let contactSearch = search.create({
                type: CONFIG.REC_TYPE,
                filters: filters,
                columns: [
                    search.createColumn({ name: CONFIG.FIELDS.FIRST_NAME }),
                    search.createColumn({ name: CONFIG.FIELDS.LAST_NAME }),
                    search.createColumn({ name: CONFIG.FIELDS.ROLE }),
                    search.createColumn({ name: CONFIG.FIELDS.CONTACT_TYPE }),
                    search.createColumn({ name: CONFIG.FIELDS.CONTACT_NUM }),
                    search.createColumn({ name: CONFIG.FIELDS.IS_INACTIVE }),
                    search.createColumn({ name: CONFIG.FIELDS.CUSTOMER_LINK })
                ]
            });

            let resultData = [];
            contactSearch.run().each(function(result) {
                resultData.push({
                    first_name: result.getValue(CONFIG.FIELDS.FIRST_NAME),
                    last_name: result.getValue(CONFIG.FIELDS.LAST_NAME),
                    designation: result.getValue(CONFIG.FIELDS.ROLE),
                    type: result.getValue(CONFIG.FIELDS.CONTACT_TYPE),
                    contact: result.getValue(CONFIG.FIELDS.CONTACT_NUM),
                    status: result.getValue(CONFIG.FIELDS.IS_INACTIVE) ? 'Inactive' : 'Active'
                });
                return true; 
            });
            return sendResponse('success', 'Data retrieved successfully', { data: resultData });

        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            return sendResponse('error', 'An unexpected error occurred: ' + ex.message);
        }
    };

    /**
     * POST method - Used to create a new record.
     * Creates a new Account Contact record based on and .
     *
     * @param {Object} requestBody
     * @returns {Object}
     */
    function post(requestBody) {
        try {
            log.debug('POST Request', requestBody);
            if (!requestBody.account_id || !requestBody.first_name || !requestBody.last_name) {
                return sendResponse('error', 'Missing mandatory fields: account_id, first_name, or last_name.');
            }
            let newRecord = record.create({
                type: CONFIG.REC_TYPE,
                isDynamic: true
            });
            newRecord.setValue({ fieldId: CONFIG.FIELDS.CUSTOMER_LINK, value: requestBody.account_id });
            newRecord.setValue({ fieldId: CONFIG.FIELDS.FIRST_NAME, value: requestBody.first_name });
            newRecord.setValue({ fieldId: CONFIG.FIELDS.LAST_NAME, value: requestBody.last_name });
            
            if (requestBody.designation) {
                newRecord.setValue({ fieldId: CONFIG.FIELDS.ROLE, value: requestBody.designation });
            }
            
            if (requestBody.type) {
                newRecord.setValue({ fieldId: CONFIG.FIELDS.CONTACT_TYPE, value: requestBody.type });
            }
            
            if (requestBody.contact) {
                newRecord.setValue({ fieldId: CONFIG.FIELDS.CONTACT_NUM, value: requestBody.contact });
            }
            if(requestBody.contact_group){
                
                 newRecord.setValue({ fieldId: CONFIG.FIELDS.CONTACT_GROUP, value: requestBody.contact_group });
            }
            let recordId = newRecord.save({
                enableSourcing: true,
                ignoreMandatoryFields: false
            });

            log.audit('Record Created', 'ID: ' + recordId);
            return sendResponse('success', 'Record created successfully');

        } catch (ex) {
            log.error("post: " + ex.name, ex.message);
            return sendResponse('error', 'Failed to create record: ' + ex.message);
        }
    };

    /**
     * PUT method - Placeholder
     */
    function put(requestBody) {
        try {
            return sendResponse('error', 'Method PUT not implemented.');
        } catch (ex) {
            log.error("put: " + ex.name, ex.message);
        }
    };

    /**
     * DELETE method - Placeholder
     */
    function deleteRecord(requestParams) {
        try {
            return sendResponse('error', 'Method DELETE not implemented.');
        } catch (ex) {
            log.error("deleteRecord: " + ex.name, ex.message);
        }
    };

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});