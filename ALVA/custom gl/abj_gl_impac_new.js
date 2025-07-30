function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
    try 
    {
        var rectype = transactionRecord.getRecordType();
        var recid = transactionRecord.getId();
        if(rectype == "invoice"){
            // nlapiLogExecution('DEBUG', 'rectype', rectype);
            var createdForm = transactionRecord.getFieldValue('createdfrom')
            if(createdForm){
                var createdFormText = transactionRecord.getFieldText('createdfrom')
                var sorecord
                var intercoStatus
                nlapiLogExecution('DEBUG', 'createdFormText', createdFormText);
                if (createdFormText.indexOf('Sales') !== -1) {
                    sorecord = nlapiLoadRecord('salesorder', createdForm);
                    intercoStatus = sorecord.getFieldValue('intercostatus')
                    // Lakukan sesuatu dengan sorecord
                } else if (createdFormText.indexOf('Quotation') !== -1) {
                    sorecord = nlapiLoadRecord('estimate', createdForm);
                    
                }
                
                nlapiLogExecution('DEBUG', 'intercoStatus', intercoStatus);
                if(!intercoStatus){
                    nlapiLogExecution('DEBUG', 'intercoStatus masuk kondisi', intercoStatus);
                    var lineSo = sorecord.getLineItemCount('recmachcustrecord_transaction_id');
                    if(lineSo > 0){
                        var linecount = standardLines.getCount();
                    nlapiLogExecution('DEBUG', 'lineSo', lineSo);
                    var linecount = standardLines.getCount();
                     if(linecount > 0){
                        var lineTransaction = transactionRecord.getLineItemCount('item');
                        var allLines = [];
                        var amountTotalLine = 0;
                        var allItemInv = [];
                        var entity_id
                        for(var i = 0;i <= lineTransaction;i++){
                            var line =  standardLines.getLine(i);
                            if ( !line.isPosting() ) continue;
                            if ( line.getId() == 0 ) continue;
                            var accId = line.getAccountId().toString();
                            var amtDebit = line.getDebitAmount().toString();
                            var amtCredit = line.getCreditAmount().toString();
                            var entityId = line.getEntityId().toString();
                            nlapiLogExecution('DEBUG', 'amtDebit', amtDebit);
                            nlapiLogExecution('DEBUG', 'amtCredit', amtCredit);
                            if(entityId){
                                entity_id = entityId
                            }
                            var item_amount = transactionRecord.getLineItemValue('item','amount', i);
                            var itemInv = transactionRecord.getLineItemValue('item','item', i);
                            if(parseFloat(item_amount) > 0){
                                allItemInv.push({
                                    itemInv : itemInv,
                                    item_amount : item_amount
                                })
                                amountTotalLine += Number(amtCredit);
                                allLines.push({accId:accId,amtDebit:amtDebit,amtCredit:amtCredit});
                            }
                        }
                        nlapiLogExecution('DEBUG', 'allLine', amtDebit);
                        var accIdInv 
                     }
                    }
                    
                    
                }
            }
            
            
            
        }	
    }catch(e){
        try {
            var err_title = 'Unexpected error';
            var err_description = '';
            if (e){
                if ( e instanceof nlobjError ){
                    err_description = err_description + ' ' + e.getCode() + '|' + e.getDetails()+e;
                } else {
                    err_description = err_description + ' ' + e.toString();
                }
            }
            nlapiLogExecution('ERROR', 'Log Error ' + err_title, err_description);
        } catch(ex) {
            nlapiLogExecution('ERROR', 'Error performing error logging');
        }
    }
}