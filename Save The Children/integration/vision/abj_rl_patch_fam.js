/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/error', 'N/log'], (record, error, log) => {

    const updateAssetRecord = (data) => {
        if (!data.internalId) {
            throw error.create({
                name: 'MISSING_ID',
                message: 'Internal ID is required for updating the record.'
            });
        }

        const fieldMap = {
            'name': data.name,
            'altname': data.altName,
            'custrecord_assetserialno': data.serialNumber,
            'custrecord_assetcaretaker': data.assetCareTaker?.assetCareTakerId,
            'custrecord_assetphysicallocn': data.location,
            'custrecord_assetdescr': data.description,
            'custrecord_assettype': data.assetType?.assetTypeId,
            'custrecord_assetcost': data.originalCost,
            'custrecord_assetcurrentcost': data.currentCost,
            'custrecord_assetaccmethod': data.depreciation,
            'custrecord_assetlifetime': data.lifetime,
            'custrecord_assetstatus': data.status?.statusId,
            'custrecord_componentof': data.componentOf?.componentOfId,
            'cseg1': data.businessUnit?.businessUnitId,
            'custrecord_ncfar_quantity': data.quantity
        };

        const valuesToUpdate = {};
        for (let key in fieldMap) {
            if (fieldMap[key] !== undefined && fieldMap[key] !== null) {
                valuesToUpdate[key] = fieldMap[key];
            }
        }

        return record.submitFields({
            type: 'customrecord_ncfar_asset',
            id: data.internalId,
            values: valuesToUpdate,
            options: {
                enableSourcing: false,
                ignoreMandatoryFields: true
            }
        });
    };

    const put = (requestBody) => {
        try {
            if (Array.isArray(requestBody)) {
                const results = requestBody.map(item => {
                    try {
                        const id = updateAssetRecord(item);
                        return { status: 'SUCCESS', message : 'Asset Success Updated', internalId: id };
                    } catch (e) {
                        return { status: 'FAILED',  message: e.message, internalId: item.internalId, };
                    }
                });
                return { status: 'COMPLETED', results: results };
            }

            const updatedId = updateAssetRecord(requestBody);
            return { status: 'SUCCESS', message : 'Asset Success Updated', internalId: updatedId };

        } catch (e) {
            log.error('PATCH_ERROR', e);
            return {
                status: 'ERROR',
                code: e.name || 'UNEXPECTED_ERROR',
                message: e.message
            };
        }
    };

    return {
        put: put
    };
});