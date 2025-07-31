/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define([
    'N/record',
    'N/log',
    'N/error',
    'N/format',
    './abj_utils_sos_integration_log_record',
    'N/search',
    'N/runtime'
], (record, log, error, format, integrationLogRecord, search, runtime) => {

    const createCustDeposit = (data) => {
        try {
            const custDeposit = record.create({
                type: 'customerdeposit',
                isDynamic: true
            });

            custDeposit.setValue({
                fieldId: 'customform',
                value: "110"
            });
            custDeposit.setValue({
                fieldId: 'customer',
                value: data.entity.internal_id
            });

            custDeposit.setValue({
                fieldId: 'subsidiary',
                value: data.subsidiary.internal_id
            });

            custDeposit.setValue({
                fieldId: 'trandate',
                value: new Date(data.tran_date)
            });

            custDeposit.setValue({
                fieldId: 'location',
                value: data.location.internal_id
            });

            custDeposit.setValue({
                fieldId: 'class',
                value: "1"
            });

            custDeposit.setValue({
                fieldId: 'department',
                value: "6"
            });

            // custDeposit.setValue({
            //     fieldId: 'exchangerate',
            //     value: data.exchange_rate
            // });

            if (data.memo) {
                custDeposit.setValue({
                    fieldId: 'memo',
                    value: data.memo
                });
            }
            log.debug('payment_name', data.payment_name)
            if (data.payment_name) {
                custDeposit.setValue({
                    fieldId: 'custbody_sos_payment_name',
                    value: data.payment_name
                });
            }

            custDeposit.setValue({
                fieldId: 'payment',
                value: data.payment_amount
            });
            custDeposit.setValue({
                fieldId: 'undepfunds',
                value: "T",
                ignoreFieldChange : true
            });
            const custDepId = custDeposit.save();
            return {
                status: true,
                salesOrderId: custDepId
            };

        } catch (e) {
            log.error('Error creating Customer Deposit', e);
            return {
                status: false,
                message: e.message
            };
        }
    };

    return {
        post: (context) => {
            var integrationLogRecordId = context.log_id || null;
      const scriptObj = runtime.getCurrentScript();
      var scriptId = scriptObj.id;
      var deploymentId = scriptObj.deploymentId
            let result;
            try {
                result = createCustDeposit(context.data);
            } catch (e) {
                result = {
                    status: false,
                    message: e.message
                };
            }

            const custDepId = result.salesOrderId;
            log.debug('salesOrderId', custDepId);

            integrationLogRecord.createSOSIntegrationLog({
                jobName: '- ABJ RS | ETP create Cust Deposit',
                jobType: 'Restlet - POST',
                jobLink: 'JOB LINK - URL DARI POS',
                reqBody: JSON.stringify(context),
                resBody: JSON.stringify(result),
                linkTrx: custDepId,
                status : result.status,
                logId : integrationLogRecordId,
                scriptId : scriptId,
                deploymentId : deploymentId
            });

            if (!result.status) {
                throw new Error(result.message);
            } else {
                return {
                    status: true,
                    message: 'Customer Deposit created successfully.',
                    data: custDepId
                };
            }
        }
    };
});
