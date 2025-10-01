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

            // Hitung total per grup dan masukkan ke setiap item
            for (var id in grouped) {
                if (grouped.hasOwnProperty(id)) {
                    var totalAmount = 0;
                    var totalAsfProsent = 0;

                    // Hitung totalAmountPembobotan dan totalAsfProsent
                    for (var k = 0; k < grouped[id].length; k++) {
                        if (grouped[id][k].isAfs === "F") {
                            totalAmount += parseFloat(grouped[id][k].amountPembobotan || "0");
                        } else if (grouped[id][k].isAfs === "T") {
                            totalAsfProsent += parseFloat(grouped[id][k].asfProsent || "0");
                        }
                    }

                    // Set kedua total ke setiap item
                    for (var m = 0; m < grouped[id].length; m++) {
                        grouped[id][m].totalAmountPembobotan = totalAmount;
                        grouped[id][m].totalAsfProsent = totalAsfProsent;
                    }
                }
            }

            return grouped;
        }



        function executeGlCredit(transactionRecord, project, taxTotal, sorecord){
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
                        var prorateAsf = transactionRecord.getLineItemValue('item','custcol_alvaprorateasf', i);
                        nlapiLogExecution('DEBUG', 'prorateAsf', prorateAsf);
                        var qtyItem = transactionRecord.getLineItemValue('item','quantity', i);
                        if(parseFloat(item_amount) > 0){
                            allItemInv.push({
                                itemInv : itemInv,
                                item_amount : item_amount,
                                lineIntem : lineIntem,
                                prorateAsf : prorateAsf,
                                qtyItem : qtyItem
                            })
                            amountTotalLine += Number(amtDebit);
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
                        new nlobjSearchColumn('incomeaccount') 
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
                    nlapiLogExecution('DEBUG', 'amountTotalLine', amountTotalLine);
                    var accIdInv 
                    if (amountTotalLine > 0) {
                        var newLine = customLines.addNewLine();
                        newLine.setAccountId(318);
                        newLine.setDebitAmount(amountTotalLine); 
                        newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');

                        if (taxTotal && taxTotal > 0) {
                            var newLine = customLines.addNewLine();
                            newLine.setAccountId(210);
                            newLine.setCreditAmount(taxTotal); 
                            newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                        }

                        allLines.forEach(function (line) {
                            var accId = line.accId;
                            var amtDebit = line.amtDebit;
                            var amtCredit = line.amtCredit;

                            if (accId) {
                                accIdInv = accId;
                                var newLine = customLines.addNewLine();
                                newLine.setAccountId(parseInt(accId));
                                newLine.setCreditAmount(amtDebit); 
                                newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');
                            }
                        });

                        var newLine = customLines.addNewLine();
                        newLine.setAccountId(318);
                        newLine.setCreditAmount(amountTotalLine); 
                        newLine.setMemo('Standard Jurnal : Jurnal balik kebutuhan pembobotan');

                        if (taxTotal && taxTotal > 0) {
                            var newLine = customLines.addNewLine();
                            newLine.setAccountId(210);
                            newLine.setDebitAmount(taxTotal); 
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
                                    var totalAmountPembobotan = line.totalAmountPembobotan
                                    var departmentPembobotan = line.departmentPembobotan;
                                    var amountPembobotan = line.amountPembobotan;
                                    var incomeAccount = line.incomeAccount;
                                    var totalAsfProsent = line.totalAsfProsent
                                    var itemInvData = null;
                                    for (var a = 0; a < allItemInv.length; a++) {
                                        if (allItemInv[a].lineIntem === idLinePembobotan) {
                                            itemInvData = allItemInv[a];
                                            break;
                                        }
                                    }
                                    var prorateAsf = itemInvData.prorateAsf
                                    var item_amount = itemInvData.item_amount
                                    var qtyItem = itemInvData.qtyItem
                                    // Contoh log
                                    nlapiLogExecution('DEBUG', 'Looping Line', 
                                        'LineID: ' + idLinePembobotan +
                                        ' | Dept: ' + departmentPembobotan +
                                        ' | Amount: ' + amountPembobotan +
                                        ' | ASF: ' + isAfs +
                                        ' | Account: ' + incomeAccount +
                                        ' | Prorate ASF: ' + prorateAsf +
                                        ' | Item Amount: ' + item_amount +
                                        ' | QTY Item: ' + qtyItem +
                                        ' | totalAmountPembobotan :' + totalAmountPembobotan +
                                        ' | asfProsent :' + asfProsent + 
                                        ' | totalAsfProsent: ' + totalAsfProsent
                                    );
                                    var amountToset = 0;
                                    if(isAfs =='F'){
                                        amountToset = ((Number(item_amount) - (Number(prorateAsf)* Number(qtyItem))) / (Number(totalAmountPembobotan)) * Number(amountPembobotan))
                                    }else{
                                        amountToset = ((Number(prorateAsf) * Number(qtyItem)) / (Number(totalAsfProsent)) * Number(asfProsent))
                                    }
                                    nlapiLogExecution("DEBUG", "Amount to set", "Amount to set: " + amountToset);

                                    var newLine = customLines.addNewLine();
                                    newLine.setAccountId(parseInt(incomeAccount));
                                    newLine.setMemo('Pembobotan -' + project);
                                    newLine.setDebitAmount(parseFloat(amountToset)); 
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
        function executeGl(transactionRecord, project, taxTotal, sorecord){
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
                        var prorateAsf = transactionRecord.getLineItemValue('item','custcol_alvaprorateasf', i);
                        var qtyItem = transactionRecord.getLineItemValue('item','quantity', i);
                        if(parseFloat(item_amount) > 0){
                            allItemInv.push({
                                itemInv : itemInv,
                                item_amount : item_amount,
                                lineIntem : lineIntem,
                                prorateAsf : prorateAsf,
                                qtyItem : qtyItem
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
                    nlapiLogExecution('DEBUG', 'amountTotalLine', amountTotalLine);
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
                                    var totalAmountPembobotan = line.totalAmountPembobotan
                                    var departmentPembobotan = line.departmentPembobotan;
                                    var amountPembobotan = line.amountPembobotan;
                                    var incomeAccount = line.incomeAccount;
                                    var totalAsfProsent = line.totalAsfProsent
                                    var itemInvData = null;
                                    for (var a = 0; a < allItemInv.length; a++) {
                                        if (allItemInv[a].lineIntem === idLinePembobotan) {
                                            itemInvData = allItemInv[a];
                                            break;
                                        }
                                    }
                                    var prorateAsf = itemInvData.prorateAsf
                                    var item_amount = itemInvData.item_amount
                                    var qtyItem = itemInvData.qtyItem
                                    // Contoh log
                                    nlapiLogExecution('DEBUG', 'Looping Line', 
                                        'LineID: ' + idLinePembobotan +
                                        ' | Dept: ' + departmentPembobotan +
                                        ' | Amount: ' + amountPembobotan +
                                        ' | ASF: ' + isAfs +
                                        ' | Account: ' + incomeAccount +
                                        ' | Prorate ASF: ' + prorateAsf +
                                        ' | Item Amount: ' + item_amount +
                                        ' | QTY Item: ' + qtyItem +
                                        ' | totalAmountPembobotan :' + totalAmountPembobotan +
                                        ' | asfProsent :' + asfProsent + 
                                        ' | totalAsfProsent: ' + totalAsfProsent
                                    );
                                    var amountToset = 0;
                                    if(isAfs =='F'){
                                        amountToset = ((Number(item_amount) - (Number(prorateAsf)* Number(qtyItem))) / (Number(totalAmountPembobotan)) * Number(amountPembobotan))
                                    }else{
                                        amountToset = ((Number(prorateAsf) * Number(qtyItem)) / (Number(totalAsfProsent)) * Number(asfProsent))
                                    }
                                    nlapiLogExecution("DEBUG", "Amount to set", "Amount to set: " + amountToset);
                                    var newLine = customLines.addNewLine();
                                    newLine.setAccountId(parseInt(incomeAccount));
                                    newLine.setMemo('Pembobotan -' + project);
                                    newLine.setCreditAmount(parseFloat(amountToset));
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
                    executeGl(transactionRecord, project, taxTotal, sorecord);
                }
            }else{
                executeGl(transactionRecord)
            }
            
            
            
        }
        if(rectype == "creditmemo"){
             var createdForm = transactionRecord.getFieldValue('createdfrom')
            if(createdForm){
                var project = transactionRecord.getFieldText('class');
                var taxTotal = transactionRecord.getFieldValue('taxtotal');
                var createdFormText = transactionRecord.getFieldText('createdfrom')
                var sorecord
                var intercoStatus
                nlapiLogExecution('DEBUG', 'createdFormText', createdFormText);
                if (createdFormText.indexOf('Invoice') !== -1) {
                    sorecord = nlapiLoadRecord('invoice', createdForm);
                }else if (createdFormText.indexOf('Return') !== -1) {
                    sorecord = nlapiLoadRecord('returnauthorization', createdForm);
                    
                }
                executeGlCredit(transactionRecord, project, taxTotal, sorecord);
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