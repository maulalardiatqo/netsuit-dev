/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/file', 'N/format', 'N/log'], (record, file, format, log) => {

    const post = (requestBody) => {
        try {
            log.audit('Webhook Received', requestBody);

            let sentAtDate = new Date(requestBody.sent_at);
            let formattedDate = format.parse({
                value: sentAtDate,
                type: format.Type.DATE
            });
            let fileName = `Webhook_Log_${new Date().getTime()}.json`;
            let jsonFile = file.create({
                name: fileName,
                fileType: file.Type.JSON,
                contents: JSON.stringify(requestBody, null, 2),
                folder: 642 
            });
            let fileId = jsonFile.save();
            log.debug('fileId', fileId)
            let customRec = record.create({
                type: 'customtransaction_abj_integration_log',
                isDynamic: true
            });

            customRec.setValue({
                fieldId: 'custbody_abj_date_transaction',
                value: formattedDate
            });

            customRec.setValue({
                fieldId: 'custbody_abj_request_body_int',
                value: JSON.stringify(requestBody)
            });

            
            let recordId = customRec.save();
            log.debug('recordId', recordId)
            record.attach({
                record: {
                    type: 'file',
                    id: fileId
                },
                to: {
                    type: 'customtransaction_abj_integration_log',
                    id: recordId
                }
            });

            return {
                status: "success",
                message: "Record created successfully",
                recordId: recordId,
                fileId: fileId
            };

        } catch (e) {
            log.error('Error Processing Webhook', e.message);
            return {
                status: "failed",
                message: e.message
            };
        }
    };

    return {
        post: post
    };
});