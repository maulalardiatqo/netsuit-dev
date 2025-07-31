function customizeGlImpact(transactionRecord, standardLines, customLines, book)
{
    try 
    {
        function groupPembobotan(data) {
            var grouped = {};

            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                var id = item.idLinePembobotan;
                if (!grouped[id]) {
                    grouped[id] = [];
                }

                if (item.isAfs === "F" && item.departmentPembobotan) {
                    var found = false;
                    for (var j = 0; j < grouped[id].length; j++) {
                        var d = grouped[id][j];
                        if (d.departmentPembobotan === item.departmentPembobotan && d.isAfs === "F") {
                            var amt = parseFloat(d.amountPembobotan || "0") + parseFloat(item.amountPembobotan || "0");
                            d.amountPembobotan = amt.toFixed(2);
                            found = true;
                            break;
                        }
                    }

                    if (!found) {
                        grouped[id].push(JSON.parse(JSON.stringify(item)));
                    }
                } else {
                    grouped[id].push(JSON.parse(JSON.stringify(item)));
                }
            }

            return grouped;
        }



        var rectype = transactionRecord.getRecordType();
        var recid = transactionRecord.getId();
        if(rectype == "invoice"){
            // nlapiLogExecution('DEBUG', 'rectype', rectype);
            var createdForm = transactionRecord.getFieldValue('createdfrom')
            if(createdForm){
                var project = transactionRecord.getFieldText('class');
                var taxTotal = transactionRecord.getFieldValue('taxtotal');
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
                    var linePembobotan = transactionRecord.getLineItemCount('recmachcustrecord_transaction_id');
                    if(linePembobotan > 0){
                        var linecount = standardLines.getCount();
                        nlapiLogExecution('DEBUG', 'linePembobotan', linePembobotan);
                        var linecount = standardLines.getCount();
                        if(linecount > 0){
                            var lineTransaction = transactionRecord.getLineItemCount('item');
                            var allLines = [];
                            var amountTotalLine = 0;
                            var allItemInv = [];
                            var entity_id;
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
                                var lineIntem = transactionRecord.getLineItemValue('item','custcol_item_id_pembobotan', i);
                                var lineIntem = transactionRecord.getLineItemValue('item','custcol_item_id_pembobotan', i);
                                if(parseFloat(item_amount) > 0){
                                    allItemInv.push({
                                        itemInv : itemInv,
                                        item_amount : item_amount,
                                        lineIntem : lineIntem
                                    })
                                    amountTotalLine += Number(amtCredit);
                                    allLines.push({accId:accId,amtDebit:amtDebit,amtCredit:amtCredit, lineIntem : lineIntem});
                                }
                            }
                            nlapiLogExecution('DEBUG', 'allItemInv', JSON.stringify(allItemInv));
                            nlapiLogExecution('DEBUG', 'allLines', JSON.stringify(allLines));
                            var itemIds = {};
                            for (var i = 1; i <= linePembobotan; i++) {
                                var itemPembobotan = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_item_pembobotan', i);
                                if (itemPembobotan && !itemIds[itemPembobotan]) {
                                    itemIds[itemPembobotan] = true;
                                }
                            }
                            var itemFilters = [
                                new nlobjSearchFilter('internalid', null, 'anyof', Object.keys(itemIds))
                            ];

                            var itemColumns = [
                                new nlobjSearchColumn('internalid'),
                                new nlobjSearchColumn('incomeaccount') // ini ID field-nya di record item
                            ];

                            var itemIncomeMap = {};
                            var searchResults = nlapiSearchRecord('item', null, itemFilters, itemColumns);

                            if (searchResults) {
                                for (var j = 0; j < searchResults.length; j++) {
                                    var res = searchResults[j];
                                    var itemId = res.getValue('internalid');
                                    var incomeAccount = res.getValue('incomeaccount');
                                    itemIncomeMap[itemId] = incomeAccount;
                                }
                            }
                            nlapiLogExecution('DEBUG', 'itemIncomeMap', JSON.stringify(itemIncomeMap));
                            var alldataPembobotan = [];
                            
                            for(var i = 1;i <= linePembobotan;i++){
                                var idLinePembobotan = sorecord.getLineItemValue('recmachcustrecord_transaction_id','custrecord_id_line', i);
                                var amountAsfpembototan = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_amount_asf_pembobotan', i);
                                nlapiLogExecution('DEBUG', 'amountAsfpembototan', amountAsfpembototan);
                                var isAfs = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_asf_pembobotan', i);
                                var asfProsent = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_asf_prosent', i);
                                var departmentPembobotan = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_department_pembobotan', i);
                                var amountPembobotan = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_amount_pembobotan', i);
                                var itemPembobotan = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_item_pembobotan', i);
                                var accAsf = sorecord.getLineItemValue('recmachcustrecord_transaction_id', 'custrecord_pembobotan_account_asf', i);
                                var incomeAccount = itemIncomeMap[itemPembobotan] || '';
                                nlapiLogExecution('DEBUG', 'isAfs', isAfs);
                                if(isAfs == 'T'){
                                    nlapiLogExecution('DEBUG', 'amountAsfpembototan when true', amountAsfpembototan);
                                    incomeAccount = accAsf;
                                    amountPembobotan = amountAsfpembototan
                                }
                                alldataPembobotan.push({
                                    idLinePembobotan : idLinePembobotan,
                                    amountAsfpembototan : amountAsfpembototan,
                                    isAfs : isAfs,
                                    asfProsent : asfProsent,
                                    departmentPembobotan : departmentPembobotan,
                                    amountPembobotan : amountPembobotan,
                                    incomeAccount : incomeAccount
                                })
                            }
                            nlapiLogExecution('DEBUG', 'alldataPembobotan', JSON.stringify(alldataPembobotan));
                            const groupingData = groupPembobotan(alldataPembobotan);
                            nlapiLogExecution('DEBUG', 'groupingData', JSON.stringify(groupingData));
                            var accIdInv 
                            if(amountTotalLine > 0){
                                var newLine = customLines.addNewLine();
                                newLine.setAccountId(318);
                                newLine.setCreditAmount(amountTotalLine);
                                newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                                if(taxTotal && taxTotal > 0){
                                    var newLine = customLines.addNewLine();
                                    newLine.setAccountId(210);
                                    newLine.setDebitAmount(taxTotal);
                                    newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                                }
                                allLines.forEach(function(line) {
                                    var accId = line.accId;
                                    var amtDebit = line.amtDebit;
                                    var amtCredit = line.amtCredit;
                                    
                                    if(accId){
                                        accIdInv = accId
                                        var newLine = customLines.addNewLine();
                                        newLine.setAccountId(parseInt(accId));
                                        newLine.setDebitAmount(amtCredit);
                                        newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                                        
                                    }
                                    
                                });
                                var newLine = customLines.addNewLine();
                                newLine.setAccountId(318);
                                newLine.setDebitAmount(amountTotalLine);
                                newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                                if(taxTotal && taxTotal > 0){
                                    var newLine = customLines.addNewLine();
                                    newLine.setAccountId(210);
                                    newLine.setCreditAmount(taxTotal);
                                    newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                                }
                                for (var idLine in groupingData) {
                                    if (groupingData.hasOwnProperty(idLine)) {
                                        var lines = groupingData[idLine];

                                        for (var i = 0; i < lines.length; i++) {
                                            var line = lines[i];

                                            var idLinePembobotan = line.idLinePembobotan;
                                            var amountAsfpembototan = line.amountAsfpembototan;
                                            var isAfs = line.isAfs;
                                            var asfProsent = line.asfProsent;
                                            var departmentPembobotan = line.departmentPembobotan;
                                            var amountPembobotan = line.amountPembobotan;
                                            var incomeAccount = line.incomeAccount;

                                            // Contoh log
                                            nlapiLogExecution('DEBUG', 'Looping Line', 
                                                'LineID: ' + idLinePembobotan +
                                                ' | Dept: ' + departmentPembobotan +
                                                ' | Amount: ' + amountPembobotan +
                                                ' | ASF: ' + isAfs +
                                                ' | Account: ' + incomeAccount
                                            );
                                            var newLine = customLines.addNewLine();
                                            newLine.setAccountId(parseInt(incomeAccount));
                                            newLine.setMemo('Pembobotan -' + project);
                                            newLine.setCreditAmount(parseFloat(amountPembobotan));
                                           if (departmentPembobotan && !isNaN(departmentPembobotan)) {
                                                newLine.setDepartmentId(parseInt(departmentPembobotan, 10));
                                            }

                                            
                                        }
                                    }
                                }

                            }
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