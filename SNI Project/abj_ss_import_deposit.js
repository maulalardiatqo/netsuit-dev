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
            log.debug('fileCOntent', fileContent);

            var lines = fileContent.split('\n');
            var columnNames = lines[0].split(',');

            var data = [];
            for (var i = 1; i < lines.length; i++) {
                var rowData = lines[i].split(',');
                var rowObject = {};
                for (var j = 0; j < columnNames.length; j++) {
                    rowObject[columnNames[j]] = rowData[j];
                }
                data.push(rowObject);
            }
            log.debug('Column Names', columnNames);
            log.debug('Data', data);

            for (var i = 0; i < data.length; i++) {
                var rowData = data[i];
                var cekNo = rowData.Transaction;
                if(cekNo){
                    var transNumber = rowData.TransactionNumber
                    var transDate = rowData.TransactionDate
                    var parts = transDate.split('/');
                    var formattedDate = parts[2] + '-' + parts[1] + '-' + parts[0];
                    log.debug('formattedDate', formattedDate);
                    var year = parts[2];
                    var month = parts[1];

                    var monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    var monthText = monthNames[parseInt(month, 10)];

                    var periodDate = monthText + ' ' + year;

                    log.debug('periodDate', periodDate);
                    var accountingperiodSearchObj = search.create({
                        type: "accountingperiod",
                        filters:
                        [
                            ["periodname","is", periodDate]
                        ],
                        columns:
                        [
                            search.createColumn({
                                name: "periodname",
                                sort: search.Sort.ASC,
                                label: "Name"
                            }),
                            search.createColumn({name: "internalid", label: "Internal ID"})
                        ]
                    });
                    var periodId
                    var searchResultCount = accountingperiodSearchObj.runPaged().count;
                    accountingperiodSearchObj.run().each(function(result){
                        var internalIdPeriod = result.getValue({
                            name : 'internalid'
                        })
                        periodId = internalIdPeriod
                    return true;
                    });
                    log.debug('periodId', periodId)
                    var date = new Date(formattedDate);
                    transDate = date
                    log.debug('transdate before format', transDate);
                    if(transDate){
                        function sysDate() {
                            var date = transDate;
                            var tdate = date.getUTCDate();
                            var month = date.getUTCMonth() + 1; // jan = 0
                            var year = date.getUTCFullYear();
                            
                            return year + '-' + month + '-' + tdate;
                        }
                        transDate = sysDate();
                    }
                    var dateFormate = new Date(transDate);
                    log.debug('dateFormate', dateFormate)
                    // var formatedDate = new Date(transDate)
                    // log.debug('formatedDate', formatedDate)
                    
                    // if(transDate){
                    //     transDate = format.format({
                    //         value: transDate,
                    //         type: format.Type.DATE
                    //     });
                    // }
                    // log.debug('transdate', transDate);
                    var subsidiary = '13'
                    var idAccHeader = rowData.InternalIDAccHeader
                    var idAccLine = rowData.InternalIdAccountline  
                    var description = rowData.Description
                    var debit = rowData.Debit
                    var createNew = record.create({
                        type : 'deposit',
                        isDynamic: true
                    })
                    createNew.setValue({
                        fieldId: 'tranid',
                        value: transNumber,
                        ignoreFieldChange: true
                    });
                    log.debug('transdate set', dateFormate);
                    createNew.setValue({
                        fieldId: 'trandate',
                        value: dateFormate,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'subsidiary',
                        value: subsidiary,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'account',
                        value: idAccHeader,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'memo',
                        value: description,
                        ignoreFieldChange: true
                    });
                    createNew.setValue({
                        fieldId: 'postingperiod',
                        value: periodId,
                        ignoreFieldChange: true
                    });
                    createNew.selectNewLine({ sublistId: 'other' });
                    log.debug('idAccLine', idAccLine)
                    createNew.setCurrentSublistValue({
                        sublistId: 'other',
                        fieldId: 'account',
                        value: idAccLine
                    });
                    createNew.setCurrentSublistValue({
                        sublistId: 'other',
                        fieldId: 'memo',
                        value: description
                    });
                    createNew.setCurrentSublistValue({
                        sublistId: 'other',
                        fieldId: 'amount',
                        value: debit
                    });
                    createNew.commitLine({ sublistId: 'other' });
                    var createIdNew = createNew.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });
                    if(createIdNew){
                        log.debug('createIdNew', createIdNew);
                    }
                }
                
            }
        }catch(e){
            log.debug('error', e)
        }
    }

    return {
        execute: execute
    };
});
