/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */

define(['N/file', 'N/log', 'N/record', 'N/search'], function(file, log, record, search) {

    function execute(context) {
        try {
            var fileId = 14316;
            var loadedFile = file.load({ id: fileId });
            log.debug('file', loadedFile);

            var contentFile = loadedFile.getContents();
            log.debug('content', contentFile);

            var rows = contentFile.split('\n');
            var dataArray = [];
            for (var i = 1; i < rows.length; i++) {
                var rowData = rows[i].trim().split(',');

                var customerID= rowData[0];
                var typeCus = rowData[1];
                var companyName = rowData[2];
                var subsidiary = rowData[3];
                var distributorCode = rowData[4];
                var salesREP = rowData[5];


                dataArray.push({
                    customerID : customerID,
                    typeCus : typeCus,
                    companyName : companyName,
                    subsidiary : subsidiary,
                    distributorCode : distributorCode,
                    salesREP : salesREP
                });
            }
            log.debug('data Array', dataArray);

            for (var j = 0; j < dataArray.length; j++) {
                var customerID = dataArray[j].customerID;
                var existingCustomer = searchExistingCustomer(customerID);

                if (existingCustomer) {
                    // Update data
                    updateCustomer(existingCustomer, dataArray[j]);
                } else {
                    // Create record baru
                    createCustomer(dataArray[j]);
                }
            }
        } catch (e) {
            log.debug('error', e);
        }
    }

    function searchExistingCustomer(customerID) {
        var customerSearch = search.create({
            type: search.Type.CUSTOMER,
            filters: [
                search.createFilter({
                    name: 'entityid',
                    operator: search.Operator.IS,
                    values: customerID
                })
            ],
            columns: ['internalid']
        }).run().getRange({ start: 0, end: 1 });

        if (customerSearch && customerSearch.length > 0) {
            var existingCustomerInternalId = customerSearch[0].getValue({ name: 'internalid' });
            return record.load({ type: record.Type.CUSTOMER, id: existingCustomerInternalId });
        }

        return null;
    }

    function updateCustomer(existingCustomer, newData) {
        log.debug('update', newData);
        existingCustomer.setValue({ fieldId: 'isperson', value: newData.typeCus });
        existingCustomer.setValue({ fieldId: 'companyname', value: newData.companyName });
        existingCustomer.setValue({ fieldId: 'subsidiary', value: newData.subsidiary});
        existingCustomer.setValue({ fieldId: 'custentity_customer_distributor_code', value: newData.distributorCode });
        existingCustomer.setValue({ fieldId: 'salesrep', value: newData.salesREP });
        existingCustomer.save();
    }

    function createCustomer(newData) {
        log.debug('create', newData);
        var newCustomer = record.create({ type: record.Type.CUSTOMER });
        newCustomer.setValue({ fieldId: 'entityid', value: newData.customerID });
        newCustomer.setValue({ fieldId: 'companyname', value: newData.companyName });
        newCustomer.setValue({ fieldId: 'subsidiary', value: newData.subsidiary});
        newCustomer.setValue({ fieldId: 'custentity_customer_distributor_code', value: newData.distributorCode });
        newCustomer.setValue({ fieldId: 'salesrep', value: newData.salesREP });
        var newCustomerSave = newCustomer.save();
        log.debug('newCustomerSave', newCustomerSave)
    }

    return {
        execute: execute
    };
});
