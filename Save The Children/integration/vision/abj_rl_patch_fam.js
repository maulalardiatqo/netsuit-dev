/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/error', 'N/log', 'N/search'], (record, error, log, search) => {

    const createLog = (status, requestBody, errorMessage) => {
        try {
            const logRecord = record.create({
                type: 'customtransaction_abj_integration_log'
            });

            logRecord.setValue({
                fieldId: 'custbody_abj_integration_status',
                value: status === 'SUCCESS' || status === 'COMPLETED' ? 1 : 2
            });

            logRecord.setValue({
                fieldId: 'custbody_abj_request_body_int',
                value: JSON.stringify(requestBody)
            });

            logRecord.setValue({
                fieldId: 'custbody_error_message',
                value: errorMessage || ''
            });

            logRecord.setValue({
                fieldId: 'custbody_abj_source_name',
                value: 'Vision'
            });

            logRecord.setValue({
                fieldId: 'custbody_abj_created_at_int',
                value: new Date()
            });

            logRecord.save();
        } catch (e) {
            log.error('LOG_CREATION_FAILURE', e.message);
        }
    };

    const updateAssetRecord = (data) => {
        if (!data.internalId) {
            throw error.create({
                name: 'MISSING_ID',
                message: 'Internal ID FAM is Required'
            });
        }

        const assetLookup = search.lookupFields({
            type: 'customrecord_ncfar_asset',
            id: data.internalId,
            columns: ['internalid']
        });

        if (!assetLookup || !assetLookup.internalid) {
            throw error.create({
                name: 'NOT_FOUND',
                message: `FAM with ID ${data.internalId} is Not Found!`
            });
        }

        const caretakerId = data.assetCareTaker?.assetCareTakerId;
        if (!caretakerId) {
            throw error.create({
                name: 'MISSING_CARETAKER',
                message: 'Internal ID Asset Care Taker Is Required for update'
            });
        }

        const employeeLookup = search.lookupFields({
            type: record.Type.EMPLOYEE,
            id: caretakerId,
            columns: ['entityid']
        });

        if (!employeeLookup || !employeeLookup.entityid) {
            throw error.create({
                name: 'CARETAKER_NOT_FOUND',
                message: 'Internal ID Asset Care Taker Is Not Found'
            });
        }

        return record.submitFields({
            type: 'customrecord_ncfar_asset',
            id: data.internalId,
            values: {
                'custrecord_assetcaretaker': caretakerId
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });
    };

    const put = (requestBody) => {
        let finalResponse;
        try {
            if (Array.isArray(requestBody)) {
                const results = requestBody.map(item => {
                    try {
                        const id = updateAssetRecord(item);
                        return { status: 'SUCCESS', message: 'Asset Success Updated', internalId: id };
                    } catch (e) {
                        return { status: 'FAILURE', message: e.message, internalId: item.internalId || null };
                    }
                });
                
                finalResponse = { status: 'COMPLETED', results: results };
                createLog('COMPLETED', requestBody, null);
                return finalResponse;
            }

            const updatedId = updateAssetRecord(requestBody);
            finalResponse = { status: 'SUCCESS', message: 'Asset Success Updated', internalId: updatedId };
            createLog('SUCCESS', requestBody, null);
            return finalResponse;

        } catch (e) {
            log.error('PUT_FAILURE', e);
            finalResponse = {
                status: 'FAILURE',
                code: e.name || 'UNEXPECTED_FAILURE',
                message: e.message
            };
            createLog('FAILURE', requestBody, e.message);
            return finalResponse;
        }
    };

    return {
        put: put
    };
});