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
 * @Script Name   :  - SSCC | RL | Accounts Integration
 * @script File   :  abj_rl_accounts_integration.js
 * @Trigger Type  :  HTTP Request
 * @Release Date  :  JAN 19, 2026
 * @Author        :  Maulal Ardi Atqo
 * @Description   :  Handle creation and retrieval of Customer (Accounts) records.
 * @Enhancement   :  
 * @NApiVersion 2.1
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 *
 ******************************************************************************/
define(['N/record', 'N/search', 'N/format', 'N/error'], (record, search, format, error) => {


    const createErrorResponse = (code, message) => {
        return {
            status: "error",
            error_code: code,
            message: message
        };
    };

    const parseDate = (dateString) => {
        if (!dateString) return null;
        return new Date(dateString); // Assumes ISO or valid JS date string
    };

    /**
     * GET method - Used to retrieve information about customer records.
     * Supports filtering by account_id or date range (start_date/end_date).
     *
     * @param {Object} requestParams
     * @returns {Object}
     */
    function get(requestParams) {
        try {
            let filters = [];
            const { account_id, start_date, end_date } = requestParams;
            if (account_id) {
                filters.push(['entityid', 'is', account_id]);
            } else {
                if (!start_date) {
                    filters.push(['isinactive', 'is', 'F']);
                } else {
                    let sDate = parseDate(start_date);
                    let eDate = end_date ? parseDate(end_date) : new Date(); 

                    if (eDate < sDate) {
                        throw error.create({
                            name: 'INVALID_DATE_RANGE',
                            message: 'end_date cannot be earlier than start_date'
                        });
                    }
                    const formattedStart = format.format({ value: sDate, type: format.Type.DATETIME });
                const formattedEnd = format.format({ value: eDate, type: format.Type.DATETIME });

                    filters.push(['lastmodifieddate', 'within', formattedStart, formattedEnd]);
                }
            }

            log.debug('filter', filters)
            const customerSearch = search.create({
                type: search.Type.CUSTOMER,
                filters: filters,
                columns: [
                    'internalid',
                    'entityid',
                    'externalid',
                    'companyname',
                    'custentity_abj_customerclass',
                    'custentity_abj_format',
                    'custentity_abj_preferredpickupdc',
                    'custentity_abj_tradevdr_trans_type',
                    'custentity_abj_paymentmode',
                    'address',
                    'custentity_abj_maincode',
                    'entitystatus',
                    'isinactive',
                    'custentity_abj_contact',
                    search.createColumn({
                        name: "internalid",
                        join: "CUSTRECORD_ABJ_CUSTGRPCODE_LINK_CUSTOMER",
                        label: "Internal ID"
                    }),
                ]
            });

            const customerMap = {};
            const pagedData = customerSearch.runPaged({ pageSize: 1000 });

            pagedData.pageRanges.forEach(pageRange => {
                const page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(res => {
                    const internalId = res.id;

                    if (!customerMap[internalId]) {
                        customerMap[internalId] = {
                            account_id: res.getValue('entityid'),
                            reference_id: res.getValue('externalid'),
                            client_name: res.getValue('companyname'),
                            store_name: res.getValue('companyname'),
                            class: res.getText('custentity_abj_customerclass'),
                            format: res.getText('custentity_abj_format'),
                            default_pickup_branch: res.getText('custentity_abj_preferredpickupdc'),
                            default_transaction_type: res.getText('custentity_abj_tradevdr_trans_type'),
                            default_ship_to_id: "",
                            default_payment_code: res.getText('custentity_abj_paymentmode'),
                            success_card_number: res.getValue('entityid'),
                            contacts: res.getValue('custentity_abj_contact'),
                            groups: [],
                            addresses: res.getValue('address'),
                            main_account_id: res.getValue('custentity_abj_maincode'),
                            lead: res.getText('entitystatus'),
                            status: res.getValue('isinactive') ? "Inactive" : "Active"
                        };
                    }

                    let groupValue = res.getValue({
                        name: "internalid",
                        join: "CUSTRECORD_ABJ_CUSTGRPCODE_LINK_CUSTOMER"
                    });

                    if (groupValue && !customerMap[internalId].groups.includes(groupValue)) {
                        customerMap[internalId].groups.push(groupValue);
                    }
                });
            });

            const resultData = Object.values(customerMap);

            return {
                status: "success",
                message: "Data retrieved successfully",
                data: resultData
            };

        } catch (ex) {
            log.error("get: " + ex.name, ex.message);
            return createErrorResponse(ex.name, ex.message);
        }
    };

    /**
     * POST method - Used to create a new Customer record.
     *
     * @param {Object} requestBody
     * @returns {Object}
     */
    function post(requestBody) {
        try {
            log.debug('requestBody', requestBody)
            if (!requestBody) {
                throw error.create({ name: 'MISSING_BODY', message: 'Request body is empty' });
            }

            if (!requestBody.how_did_u_know_suysing || !requestBody.funnel  || !requestBody.sales_rep  || !requestBody.reference_id || !requestBody.store_name) {
                throw error.create({ name: 'MISSING_REQUIRED_FIELD', message: 'reference_id and store_name are required.' });
            }

            const rec = record.create({
                type: record.Type.CUSTOMER,
                isDynamic: true
            });
            rec.setValue({ fieldId: 'externalid', value: requestBody.reference_id });
            if (requestBody.first_name) {
                rec.setValue({ fieldId: 'custentity_abj_entity_ow_fname', value: requestBody.first_name });
            }
            if (requestBody.last_name) {
                rec.setValue({ fieldId: 'custentity_abj_entity_ow_lname', value: requestBody.last_name });
            }
            rec.setValue({ fieldId: 'companyname', value: requestBody.store_name });
            if (requestBody.format) {
                rec.setValue({ fieldId: 'custentity_abj_format', value: requestBody.format });
            }
            if (requestBody.lead_source) {
                rec.setValue({ fieldId: 'leadsource', value: requestBody.lead_source });
            }
            if (requestBody.contacts) {
                rec.setValue({ fieldId: 'custrecord_abj_cont_confirname', value: requestBody.contacts });
            }
            if (requestBody.address) {
                rec.setValue({ fieldId: 'defaultaddress', value: requestBody.address });
                let addrSubRec = rec.getCurrentSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress'
                });

                addrSubRec.setValue({ fieldId: 'country', value: 'PH' });
                addrSubRec.setValue({ fieldId: 'addressee', value: requestBody.address });

                rec.commitLine({ sublistId: 'addressbook' });
            }
            if (requestBody.data_privacy_agreement_at) {
                let privacyDate = parseDate(requestBody.data_privacy_agreement_at);
                if (privacyDate) {
                    rec.setValue({ fieldId: 'custentity_abj_datapriconsentdatemanual', value: privacyDate });
                }
            }
            rec.setValue({fieldId : 'custentity_abj_cust_salesrep', value :requestBody.sales_rep});
            rec.setValue({fieldId : 'custentity_abj_funnel', value :requestBody.funnel});
            rec.setValue({fieldId : 'custentity_abj_knabotss', value :requestBody.how_did_u_know_suysing});
            
            const recordId = rec.save();
            log.audit('Customer Created', 'ID: ' + recordId + ', Ref: ' + requestBody.reference_id);

            return {
                status: "success",
                message: "Record created successfully",
                internal_id: recordId
            };

        } catch (ex) {
            log.error("post: " + ex.name, ex.message);
            return createErrorResponse(ex.name, ex.message);
        }
    };

    /**
     * PUT method - Update not requested but skeleton provided.
     */
    function put(requestBody) {
        try {
            return createErrorResponse("NOT_IMPLEMENTED", "PUT method is not implemented");
        } catch (ex) {
            log.error("put: " + ex.name, ex.message);
            return createErrorResponse(ex.name, ex.message);
        }
    };

    /**
     * DELETE method - Delete not requested but skeleton provided.
     */
    function deleteRecord(requestParams) {
        try {
            return createErrorResponse("NOT_IMPLEMENTED", "DELETE method is not implemented");
        } catch (ex) {
            log.error("deleteRecord: " + ex.name, ex.message);
            return createErrorResponse(ex.name, ex.message);
        }
    };

    return {
        get: get,
        post: post,
        put: put,
        delete: deleteRecord
    };
});