/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/email', 'N/runtime', 'N/file', 'N/format'],
  function(search, record, email, runtime, file, format) {
    
    function execute(scriptContext) {
        try {
            var fileId = '73914'
            var fileObj = file.load({ id: fileId });
            var fileContent = fileObj.getContents();

            var lines = fileContent.split('\n');
            var columnNames = lines[0].split(',');

            var data = [];
            for (var i = 1; i < lines.length; i++) {
                var rowData = lines[i].split(',');
                var rowObject = {};
                for (var j = 0; j < columnNames.length; j++) {
                    rowObject[columnNames[j]] = rowData[j]
                }
                data.push(rowObject);
            }
            log.debug('data', data);
            log.debug('datalength', data.length);
            for (var i = 0; i < data.length; i++) {
                var rowData = data[i];
                var invId = rowData.invid;
                var amount = rowData.debit;
                log.debug('amount', amount);
                if (invId) {
                    log.debug('invId', invId);
                    var recInv = record.load({
                        type: 'invoice',
                        id: invId,
                        isDynamic: false,
                    });
                    var totalAmount = recInv.getValue('total');
                    log.debug('totalAmount', totalAmount);
                    var diff = Number(totalAmount) - Number(amount);
                    log.debug('diff', diff);
                }
                var pyId = rowData.pyid;
                log.debug('pyId', pyId);
            }
        }catch(e){
            log.debug('error', e)
        }
    }
    return {
        execute: execute
    };
});
