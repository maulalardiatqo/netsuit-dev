/**
 * @NApiVersion 2.x
 * @NScriptType CustomGlPlugin
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    function getAccountIdByName(accountName) {
        var accountSearch = search.create({
            type: search.Type.ACCOUNT,
            filters: [
                ['name', 'contains', accountName]
            ],
            columns: ['internalid']
        });
        
        var results = accountSearch.run().getRange({ start: 0, end: 1 });
        if (results && results.length > 0) {
            return results[0].getValue('internalid');
        }
        return null; 
    }

    var accountTypeCache = {};
    function isPayableOrReceivable(accountId) {
        if (!accountId) return false;
        if (accountTypeCache[accountId] !== undefined) return accountTypeCache[accountId];

        try {
            var accData = search.lookupFields({
                type: search.Type.ACCOUNT,
                id: accountId,
                columns: ['type']
            });
            
            var typeVal = accData.type;
            if (Array.isArray(typeVal) && typeVal.length > 0) {
                typeVal = typeVal[0].value;
            }
            
            var isApAr = (typeVal === 'AcctPay' || typeVal === 'AcctRec');
            accountTypeCache[accountId] = isApAr;
            return isApAr;
        } catch (e) {
            log.error('Error Checking Account Type', e.toString());
            return false;
        }
    }

    function customizeGlImpact(transactionContext) {
        try {
            var txn = transactionContext.transactionRecord;

            var totalPayment = 0;
            var lineCount = txn.getLineCount({ sublistId: 'apply' });
            
            for (var j = 0; j < lineCount; j++) {
                var isApplied = txn.getSublistValue({ sublistId: 'apply', fieldId: 'apply', line: j });
                if (isApplied === true || isApplied === 'T') {
                    var appliedAmt = txn.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: j });
                    totalPayment += parseFloat(appliedAmt) || 0;
                }
            }

            var payment = totalPayment;
            var taxCodeId = txn.getValue({ fieldId: 'custbody_pdt_tax_code' });
            var vendorAcc = txn.getValue({ fieldId: 'custbody_pdt_abj_cust_dep_account' });
            
            // Ambil exchange rate dari header, default 1 jika kosong
            var exchangeRateStr = txn.getValue({ fieldId: 'exchangerate' });
            var exchangeRate = parseFloat(exchangeRateStr) || 1;
            
            // Konversi nilai payment dengan exchange rate
            var basePayment = payment * exchangeRate;

            if (!taxCodeId || !vendorAcc || basePayment <= 0) {
                log.debug('Custom GL Skipped', 'Missing tax code, vendor account, or applied amount is 0');
                return;
            }

            var taxRecord = record.load({
                type: record.Type.SALES_TAX_ITEM,
                id: taxCodeId
            });

            var rawRate = taxRecord.getValue({ fieldId: 'rate' });
            var vatPrepaymentText = taxRecord.getValue({ fieldId: 'acct1' });

            var rateStr = rawRate ? String(rawRate).replace('%', '') : '0';
            var rate = parseFloat(rateStr) || 0;
            var vatPrepaymentId = null;

            // Validasi dan pencarian akun VAT hanya dijalankan jika rate > 0
            if (rate > 0) {
                if (!vatPrepaymentText) {
                    log.error('Custom GL Error', 'Tax Code incomplete (acct1 is missing for non-zero rate)');
                    return;
                }
                
                vatPrepaymentId = getAccountIdByName(vatPrepaymentText);
                if (!vatPrepaymentId) {
                    log.error('Custom GL Error', 'Account Name "' + vatPrepaymentText + '" not found in Chart of Accounts.');
                    return;
                }
            }

            // Jika rate 0, seluruh nilai dialokasikan ke vendor menggunakan basePayment
            var vendorAmount = basePayment;
            var vatAmount = 0;

            if (rate > 0) {
                vendorAmount = Math.round(((100 / (100 + rate)) * basePayment) * 100) / 100;
                vatAmount = Math.round((basePayment - vendorAmount) * 100) / 100;
            }

            var stdLines = transactionContext.standardLines;
            if (stdLines.count < 2) {
                log.error('Custom GL Error', 'Standard GL lines count < 2');
                return;
            }

            var prepaymentAccountId = txn.getValue({ fieldId: 'aracct' });
            var defaultEntity = null;
            var defaultDepartment = null;
            var defaultClass = null;
            var defaultLocation = null;

            for (var i = 0; i < stdLines.count; i++) {
                var stdLine = stdLines.getLine({ index: i });
                var reverseLine = transactionContext.customLines.addNewLine();

                reverseLine.accountId = parseInt(stdLine.accountId, 10);
                
                var isStdLineApAr = isPayableOrReceivable(stdLine.accountId);
                if (!isStdLineApAr && stdLine.entityId) {
                    reverseLine.entityId = parseInt(stdLine.entityId, 10);
                }
                
                if (stdLine.departmentId) reverseLine.departmentId = parseInt(stdLine.departmentId, 10);
                if (stdLine.classId) reverseLine.classId = parseInt(stdLine.classId, 10);
                if (stdLine.locationId) reverseLine.locationId = parseInt(stdLine.locationId, 10);
                
                reverseLine.memo = stdLine.memo || 'Custom GL Reversal';

                if (stdLine.creditAmount > 0) {
                    reverseLine.debitAmount = stdLine.creditAmount;
                    defaultEntity = stdLine.entityId;
                    defaultDepartment = stdLine.departmentId;
                    defaultClass = stdLine.classId;
                    defaultLocation = stdLine.locationId;
                } else if (stdLine.debitAmount > 0) {
                    reverseLine.creditAmount = stdLine.debitAmount;
                }
            }

            if (!prepaymentAccountId) {
                log.error('Custom GL Error', 'Failed to identify debit line for Prepayment Account');
                return;
            }

            function addCustomLine(accountId, isDebit, amount, memo) {
                var parsedAccountId = parseInt(accountId, 10);
                if (isNaN(parsedAccountId)) {
                    throw new Error("Invalid Account ID for '" + memo + "': " + accountId);
                }

                var newLine = transactionContext.customLines.addNewLine();
                newLine.accountId = parsedAccountId;
                
                if (isDebit) {
                    newLine.debitAmount = amount;
                } else {
                    newLine.creditAmount = amount;
                }
                
                var isCustomLineApAr = isPayableOrReceivable(parsedAccountId);
                if (!isCustomLineApAr && defaultEntity) {
                    newLine.entityId = parseInt(defaultEntity, 10);
                }
                
                if (defaultDepartment) newLine.departmentId = parseInt(defaultDepartment, 10);
                if (defaultClass) newLine.classId = parseInt(defaultClass, 10);
                if (defaultLocation) newLine.locationId = parseInt(defaultLocation, 10);
                
                newLine.memo = memo;
            }

            // Gunakan nilai yang sudah dikali exchangerate (vendorAmount, vatAmount, basePayment)
            addCustomLine(vendorAcc, true, vendorAmount, 'Vendor Acc App Allocation');

            // Hanya membuat jurnal pajak jika vatAmount > 0
            if (vatAmount > 0 && vatPrepaymentId) {
                addCustomLine(vatPrepaymentId, true, vatAmount, 'VAT Prepayment App Allocation');
            }

            addCustomLine(prepaymentAccountId, false, basePayment, 'Prepayment Offset App Custom GL');

        } catch (e) {
            log.error('Custom GL Unexpected Error', e.toString());
        }
    }

    return {
        customizeGlImpact: customizeGlImpact
    };
});