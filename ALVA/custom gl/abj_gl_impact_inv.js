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
                    var lineSo = sorecord.getLineItemCount('recmachcustrecord_ajb_pembobotan_so_id');

                    // nlapiLogExecution('DEBUG', 'lineSo', lineSo);
                    // nlapiLogExecution('DEBUG', 'createdForm', createdForm);
                    var linecount = standardLines.getCount();
                    nlapiLogExecution('DEBUG', 'lineSo', lineSo);
                    
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
                        var accIdInv 
                        if(amountTotalLine > 0){
                            var newLine = customLines.addNewLine();
                            newLine.setAccountId(318);
                            newLine.setCreditAmount(amountTotalLine);
                            // newLine.setEntityId(parseInt(entity_id));
                            newLine.setMemo('Journal Balik');

                            allLines.forEach(function(line) {
                                var accId = line.accId;
                                var amtDebit = line.amtDebit;
                                var amtCredit = line.amtCredit;
                                
                                if(accId){
                                    accIdInv = accId
                                    var newLine = customLines.addNewLine();
                                    newLine.setAccountId(parseInt(accId));
                                    // newLine.setEntityId(parseInt(entity_id));
                                    newLine.setDebitAmount(amtCredit);
                                    newLine.setMemo('Journal Balik');
                                    
                                }
                                
                            });
                            

                        }
                        if(lineSo > 0){
                            var pembobotanPerItem = []
                            for(var i = 1;i <= lineSo;i++){
                                var itemSo = sorecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_item', i);
                                var departmentSo = sorecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_department', i);
                                var pembobotan = sorecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_persen', i);
                                var departmentText = sorecord.getLineItemText('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_department', i);
                                var pembobotanText = sorecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_persen', i);
                                nlapiLogExecution('DEBUG', 'departmentText', departmentText);
                                    nlapiLogExecution('DEBUG', 'pembobotanText', pembobotanText);
                                var memoText = "Pembobotan " + pembobotanText + " Untuk Departement  "+ departmentText ;
                                if(pembobotan){
                                    pembobotan = pembobotan.replace(/%/g, '');
                                    pembobotan = Number(pembobotan)
                                }
                                pembobotanPerItem.push({
                                    itemSo : itemSo,
                                    departmentSo : departmentSo,
                                    pembobotan : pembobotan,
                                    memoText : memoText
                                })
                            }
                        }
                        allItemInv.forEach(function(itemInvInfo) {
                            var itemId = itemInvInfo.itemInv;
                            
                            var itemAmount = parseFloat(itemInvInfo.item_amount);
                            var berapaLooping = 0
                            for (var i = 0; i < pembobotanPerItem.length; i++) {
                                var pembobotanItem = pembobotanPerItem[i];
                                var itemSoId = pembobotanItem.itemSo
                                if(itemId == itemSoId){
                                    berapaLooping ++
                                    var department = pembobotanItem.departmentSo;
                                    var pembobotan = parseFloat(pembobotanItem.pembobotan);
                                    var persentasePembobotan = pembobotan * itemAmount / 100;
                                    var memoText = pembobotanItem.memoText
                                    

                                    var newLineDebit = customLines.addNewLine();
                                    newLineDebit.setAccountId(318);
                                    newLineDebit.setDebitAmount(persentasePembobotan);
                                    newLineDebit.setDepartmentId(parseInt(department));
                                    // newLineDebit.setEntityId(parseInt(entity_id));
                                    newLineDebit.setMemo(memoText);

                                    var newLineCredit = customLines.addNewLine();
                                    newLineCredit.setAccountId(parseInt(accIdInv));
                                    newLineCredit.setDepartmentId(parseInt(department));
                                    newLineCredit.setCreditAmount(persentasePembobotan);
                                    // newLineCredit.setEntityId(parseInt(entity_id));
                                    newLineCredit.setMemo(memoText);

                                }
                            }
                        });
                    }
                }
            }else{
                var lineInv = transactionRecord.getLineItemCount('recmachcustrecord_ajb_pembobotan_so_id');
                if(lineInv > 0){
                    var totalAmountPemb = 0;
                    for(var k = 1;k <= lineInv;k++){
                        var amountPemb = transactionRecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_alva_fix_amount', k);
                        totalAmountPemb += Number(amountPemb)
                    }
                    var groupPemb = []
                    for(var i = 1;i <= lineInv;i++){
                        var itemId = transactionRecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_item', i);
                        var departmentId = transactionRecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_department', i);
                        var amountPemb = transactionRecord.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_alva_fix_amount', i);
                        var pembobotanPr = Number(amountPemb / totalAmountPemb) * 100
                        var textDepartment = transactionRecord.getLineItemText('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_department', i);
                        nlapiLogExecution('DEBUG', 'amountPemb', amountPemb);
                        
                        if(pembobotanPr){
                            pembobotanPr = pembobotanPr.toFixed(4)
                        }
                        var memo = "Pembobotan " + pembobotanPr + "% Untuk Departement  "+ textDepartment ;
                        nlapiLogExecution('DEBUG', 'pembobotanPr', pembobotanPr);
                        groupPemb.push({
                            itemId : itemId,
                            departmentId : departmentId,
                            pembobotanPr : pembobotanPr,
                            amountPemb : amountPemb,
                            memo : memo
                        })
                    }
                
                    var lineTrans = transactionRecord.getLineItemCount('item');
                    var lines = [];
                    var totalAmount = 0;
                    var allItem = [];
                    if(lineTrans > 0){
                        for(var i = 0;i <= lineTrans;i++){
                            var line =  standardLines.getLine(i);
                            if ( !line.isPosting() ) continue;
                            if ( line.getId() == 0 ) continue;
                            var accId = line.getAccountId().toString();
                            var amtDebit = line.getDebitAmount().toString();
                            var amtCredit = line.getCreditAmount().toString();
                            var entityId = line.getEntityId().toString();
                            
                            if(entityId){
                                entity_id = entityId
                            }
                            var item_amount = transactionRecord.getLineItemValue('item','amount', i);
                            var itemInv = transactionRecord.getLineItemValue('item','item', i);
                            if(parseFloat(item_amount) > 0){
                                allItem.push({
                                    itemInv : itemInv,
                                    item_amount : item_amount
                                })
                                totalAmount += Number(amtCredit);
                                lines.push({accId:accId,amtDebit:amtDebit,amtCredit:amtCredit});
                            }
                        }
                    }else{
                        for(var i = 0;i <= lineTrans;i++){
                            var grossAmt = transactionRecord.getLineItemValue('item', 'grossamt', i);
                            totalAmount += parseFloat(grossAmt)
                        }
                    }
                    
                    if(totalAmount > 0){
                        nlapiLogExecution('DEBUG', 'masuk total amount', totalAmount)
                        var newLine = customLines.addNewLine();
                        newLine.setAccountId(318);
                        newLine.setCreditAmount(totalAmount);
                        newLine.setMemo('Journal Balik');

                        lines.forEach(function(line) {
                            var accId = line.accId;
                            var amtDebit = line.amtDebit;
                            var amtCredit = line.amtCredit;
                            
                            if(accId){
                                accIdInv = accId
                                nlapiLogExecution('DEBUG', 'accIdInv', accIdInv);
                                var newLine = customLines.addNewLine();
                                newLine.setAccountId(parseInt(accId));
                                
                                newLine.setDebitAmount(amtCredit);
                                newLine.setMemo('Journal Balik');
                                
                            }
                            
                        });

                    }
                    allItem.forEach(function(itemInvInfo) {
                        var itemId = itemInvInfo.itemInv;
                        
                        var itemAmount = parseFloat(itemInvInfo.item_amount);
                        nlapiLogExecution('DEBUG', 'itemAmount', itemAmount);
                        var berapaLooping = 0
                        for (var i = 0; i < groupPemb.length; i++) {
                            var pembobotanItem = groupPemb[i];
                            var itemSoId = pembobotanItem.itemId
                            if(itemId == itemSoId){
                                berapaLooping ++
                                var department = pembobotanItem.departmentId;
                                var amountPemb = pembobotanItem.amountPemb;
                                var pembobotan = parseFloat(pembobotanItem.pembobotanPr);
                                var persentasePembobotan = pembobotan * itemAmount / 100;
                                nlapiLogExecution('DEBUG', 'persentasePembobotan', persentasePembobotan);
                                var memoText = pembobotanItem.memo
                                
                                var newLineDebit = customLines.addNewLine();
                                newLineDebit.setAccountId(318);
                                newLineDebit.setDebitAmount(amountPemb);
                                newLineDebit.setDepartmentId(parseInt(department));
                                newLineDebit.setMemo(memoText);

                                var newLineCredit = customLines.addNewLine();
                                newLineCredit.setAccountId(parseInt(accIdInv));
                                newLineCredit.setDepartmentId(parseInt(department));
                                newLineCredit.setCreditAmount(amountPemb);
                                newLineCredit.setMemo(memoText);

                            }
                        }
                    });
                }
            }
        }	
        if(rectype == "customerpayment"){
            var linePaymnet = transactionRecord.getLineItemCount('apply');
            var undephAccount = transactionRecord.getFieldValue('undepfunds');
            nlapiLogExecution('DEBUG', 'undephAccount', undephAccount);
            if(undephAccount == 'F'){
                var accountHeader = transactionRecord.getFieldValue('account')
                var linePayCount = standardLines.getCount();
                if (linePayCount == 0) return; 
                nlapiLogExecution('DEBUG', 'linePayCount', linePayCount);
                var allDataGl = []
                if(linePayCount > 0){
                    var sumTotalDebit = 0
                    var sumTotalCredit = 0
                    var accountSo
                    for(var j = 0; j < linePayCount; j++){
                        var linePay =  standardLines.getLine(j);
                        nlapiLogExecution('DEBUG', 'linePay', linePay);
                        if ( !linePay.isPosting() ) continue;
                        if ( linePay.getId() == 0 ) continue;
                        var idAcc = linePay.getAccountId().toString();
                        var debitAmt = linePay.getDebitAmount().toString();
                        var creditAmt = linePay.getCreditAmount().toString();
                        var idEntity = linePay.getEntityId().toString();
                        accountSo = idAcc
                        sumTotalDebit += parseFloat(debitAmt);
                        sumTotalCredit += parseFloat(creditAmt);
                        allDataGl.push({
                            idAcc : idAcc,
                            debitAmt : debitAmt,
                            creditAmt : creditAmt,
                            idEntity : idEntity
                        })
                        nlapiLogExecution('DEBUG', 'debitAmt', debitAmt);
                        nlapiLogExecution('DEBUG', 'creditAmt', creditAmt);
                        nlapiLogExecution('DEBUG', 'idAcc', idAcc);
                    }
                    
                }

                if(linePaymnet > 0){
                    nlapiLogExecution('DEBUG', 'linePaymnet', linePaymnet);
                    for(var i = 1;i <= linePaymnet;i++){
                        var isApply = transactionRecord.getLineItemValue('apply','apply', i);
                        nlapiLogExecution('DEBUG', 'isApply', isApply);
                        if(isApply == 'T'){
                            nlapiLogExecution('DEBUG', 'applyTrue', i);
                            var idInv = transactionRecord.getLineItemValue('apply','internalid', i);
                            nlapiLogExecution('DEBUG', 'idInv', idInv);
                            if(idInv){
                                var invRecord = nlapiLoadRecord('invoice', idInv);
                                var lineInv = invRecord.getLineItemCount('item');
                                nlapiLogExecution('DEBUG', 'lineInv', lineInv);
                                var allLineInv = []
                                if(lineInv > 0){
                                    for(var u = 0;u <= lineInv;u++){
                                        var idItem = invRecord.getLineItemValue('item', 'item', u);
                                        var amountItem = invRecord.getLineItemValue('item', 'amount', u);
                                        allLineInv.push({
                                            idItem : idItem,
                                            amountItem : amountItem
                                        })
                                    }
                                }
                                
                                // rec So
                                var soForm = invRecord.getFieldValue('createdfrom');
                                var recSo = nlapiLoadRecord('salesorder', soForm);
                                var statusInterco = recSo.getFieldValue('intercostatus')
                                nlapiLogExecution('DEBUG', 'statusInterco', statusInterco);
                                if(!statusInterco){
                                    var newLine = customLines.addNewLine();
                                    newLine.setAccountId(parseInt(accountHeader));
                                    newLine.setCreditAmount(sumTotalCredit);
                                    newLine.setMemo('Journal Balik');
            
                                    allDataGl.forEach(function(data){
                                        var idAcc = data.idAcc
                                        var debitAmt = data.debitAmt
                                        var creditAmt = data.creditAmt
                                        
                                        var newLine = customLines.addNewLine();
                                        newLine.setAccountId(parseInt(idAcc));
                                        newLine.setDebitAmount(creditAmt);
                                        newLine.setMemo('Journal Balik');
                                    })
                                    var soLine = recSo.getLineItemCount('recmachcustrecord_ajb_pembobotan_so_id');
                                    nlapiLogExecution('DEBUG', 'soLine', soLine);
                                    if(soLine > 0){
                                        var allItemPembobotan = []
                                        for(var k = 1;k <= soLine;k++){
                                            var soItem = recSo.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_item', k);
                                            var soDepartment = recSo.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_department', k);
                                            var soPembobotan = recSo.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_persen', k);
                                            var SodepartmentText = recSo.getLineItemText('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_department', k);
                                            var SopembobotanText = recSo.getLineItemValue('recmachcustrecord_ajb_pembobotan_so_id','custrecord_abj_pembobotan_persen', k);
                                            nlapiLogExecution('DEBUG', 'departmentText', SodepartmentText);
                                            nlapiLogExecution('DEBUG', 'pembobotanText', SopembobotanText);
                                            var SomemoText = "Pembobotan " + SopembobotanText + " Untuk Departement  "+ SodepartmentText ;
                                            if(soPembobotan){
                                                soPembobotan = soPembobotan.replace(/%/g, '');
                                                soPembobotan = Number(soPembobotan)
                                            }
                                            allItemPembobotan.push({
                                                soItem : soItem,
                                                soDepartment : soDepartment,
                                                soPembobotan : soPembobotan,
                                                SomemoText : SomemoText
                                            })
                                        }
                                        
                                    }
                                    if(allLineInv){
                                        allLineInv.forEach(function(line){
                                            var idItem = line.idItem;
                                            var amountItem = line.amountItem;
                                            nlapiLogExecution('DEBUG', 'allItemPembobotan', allItemPembobotan);
                                            for(var j = 0; j < allItemPembobotan.length; j++){
                                                var temPembobotan = allItemPembobotan[j];
                                                var soItem = temPembobotan.soItem
                                                var soDepartment = temPembobotan.soDepartment
                                                var soPembobotan = temPembobotan.soPembobotan
                                                var SomemoText = temPembobotan.SomemoText
                                                if(idItem == soItem){
                                                    var sumPembobotan = soPembobotan * amountItem / 100;
                                                    nlapiLogExecution('DEBUG', 'SomemoText', SomemoText);
                                                    nlapiLogExecution('DEBUG', 'sumPembobotan', sumPembobotan);
    
                                                    var newLineDebit = customLines.addNewLine();
                                                    newLineDebit.setAccountId(parseInt(accountHeader));
                                                    newLineDebit.setDebitAmount(sumPembobotan);
                                                    newLineDebit.setDepartmentId(parseInt(soDepartment));
                                                    // newLineDebit.setEntityId(parseInt(entity_id));
                                                    newLineDebit.setMemo(SomemoText);
    
    
                                                    var newLineCredit = customLines.addNewLine();
                                                    newLineCredit.setAccountId(parseInt(accountSo));
                                                    newLineCredit.setDepartmentId(parseInt(soDepartment));
                                                    newLineCredit.setCreditAmount(sumPembobotan);
                                                    // newLineCredit.setEntityId(parseInt(entity_id));
                                                    newLineCredit.setMemo(SomemoText);
                                                }
                                            }
                                        })
                                    }
                                }else{
                                    nlapiLogExecution('DEBUG', 'statusInterco (tidak tereksekusi)', statusInterco);
                                }
                                
                            }
                        }
                    }
                }
            }
           
        }
    } catch(e) {
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
