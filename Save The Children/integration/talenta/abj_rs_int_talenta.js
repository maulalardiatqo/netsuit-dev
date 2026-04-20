/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/record', 'N/file', 'N/format', 'N/log', 'N/https'], (record, file, format, log, https) => {

    const post = (requestBody) => {
        try {
            log.audit('Webhook Received', requestBody);
            log.debug({
                title: 'Request Details',
                details: `Type of Request Body: ${typeof requestBody}`
            });
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
            log.debug('File Created', `ID: ${fileId}`);

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

            customRec.setValue({
                fieldId: 'custbody_file_integration',
                value: fileId
            });

            let recordId = customRec.save();
            log.debug('Record Created', `ID: ${recordId}`);

            return {
                status: "success",
                message: "Record created successfully",
                recordId: recordId
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