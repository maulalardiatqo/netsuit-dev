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

    function customizeGlImpact(transactionContext) {
        try {
            var txn = transactionContext.transactionRecord;

            var paymentStr = txn.getValue({ fieldId: 'payment' });
            var payment = parseFloat(paymentStr) || 0;

            // --- TAMBAHAN: Ambil Exchange Rate ---
            var exchangeRateStr = txn.getValue({ fieldId: 'exchangerate' });
            var exchangeRate = parseFloat(exchangeRateStr) || 1; 

            var taxCodeId = txn.getValue({ fieldId: 'custbody_pdt_tax_code' });
            var vendorAcc = txn.getValue({ fieldId: 'custbody_pdt_abj_cust_dep_account' });
            
            log.debug('payment', payment);
            log.debug('exchangeRate', exchangeRate);
            log.debug('vendorAcc', vendorAcc);
            log.debug('taxCodeId', taxCodeId);
            
            if (!taxCodeId || !vendorAcc || payment <= 0) {
                log.debug('Custom GL Skipped', 'Missing tax code, vendor account, or payment <= 0');
                return;
            }

            var taxRecord = record.load({
                type: record.Type.SALES_TAX_ITEM,
                id: taxCodeId
            });

            var rawRate = taxRecord.getValue({ fieldId: 'rate' });
            var vatPrepaymentText = taxRecord.getValue({ fieldId: 'acct2' });
            
            log.debug('rawRate', rawRate);
            log.debug('vatPrepaymentText', vatPrepaymentText);
            log.debug('paymentStr', paymentStr);
            
            var rateStr = rawRate ? String(rawRate).replace('%', '') : '0';
            var rate = parseFloat(rateStr) || 0;
            var vatPrepaymentId = null;

            // Hanya wajibkan pengecekan akun VAT jika rate pajak > 0
            if (rate > 0) {
                if (!vatPrepaymentText) {
                    log.error('Custom GL Error', 'Tax Code incomplete (acct2 is missing for non-zero rate)');
                    return;
                }
                vatPrepaymentId = getAccountIdByName(vatPrepaymentText);
                if (!vatPrepaymentId) {
                    log.error('Custom GL Error', 'Account Name "' + vatPrepaymentText + '" not found in Chart of Accounts.');
                    return;
                }
            }

            // --- TAMBAHAN: Kalikan payment dengan exchangerate ---
            var paymentBase = payment * exchangeRate;

            // Perhitungan: Jika rate 0, seluruh amount adalah vendor amount
            // Gunakan paymentBase yang sudah dikali exchange rate
            var vendorAmount = paymentBase;
            var vatAmount = 0;

            if (rate > 0) {
                vendorAmount = Math.round(((100 / (100 + rate)) * paymentBase) * 100) / 100;
                vatAmount = Math.round((paymentBase - vendorAmount) * 100) / 100;
            }

            var stdLines = transactionContext.standardLines;
            if (stdLines.count < 2) {
                log.error('Custom GL Error', 'Standard GL lines count < 2');
                return;
            }

            var prepaymentAccountId = null;
            var defaultEntity = null;
            var defaultDepartment = null;
            var defaultClass = null;
            var defaultLocation = null;

            // LINE: REVERSAL DEFAULT NETSUITE GL
            for (var i = 0; i < stdLines.count; i++) {
                var stdLine = stdLines.getLine({ index: i });
                var reverseLine = transactionContext.customLines.addNewLine();

                reverseLine.accountId = parseInt(stdLine.accountId, 10);
                
                if (stdLine.entityId) reverseLine.entityId = parseInt(stdLine.entityId, 10);
                if (stdLine.departmentId) reverseLine.departmentId = parseInt(stdLine.departmentId, 10);
                if (stdLine.classId) reverseLine.classId = parseInt(stdLine.classId, 10);
                if (stdLine.locationId) reverseLine.locationId = parseInt(stdLine.locationId, 10);
                
                reverseLine.memo = stdLine.memo || 'Custom GL Reversal';

                if (stdLine.debitAmount > 0) {
                    reverseLine.creditAmount = stdLine.debitAmount;
                    prepaymentAccountId = stdLine.accountId;
                    defaultEntity = stdLine.entityId;
                    defaultDepartment = stdLine.departmentId;
                    defaultClass = stdLine.classId;
                    defaultLocation = stdLine.locationId;
                } else if (stdLine.creditAmount > 0) {
                    reverseLine.debitAmount = stdLine.creditAmount;
                }
            }

            if (!prepaymentAccountId) {
                log.error('Custom GL Error', 'Failed to identify debit line for Prepayment Account');
                return;
            }

            // Helper Function Pembuat Line
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
                
                if (defaultEntity) newLine.entityId = parseInt(defaultEntity, 10);
                if (defaultDepartment) newLine.departmentId = parseInt(defaultDepartment, 10);
                if (defaultClass) newLine.classId = parseInt(defaultClass, 10);
                if (defaultLocation) newLine.locationId = parseInt(defaultLocation, 10);
                
                newLine.memo = memo;
            }

            // Gunakan amount hasil perhitungan yang sudah dikali exchange rate
            addCustomLine(vendorAcc, false, vendorAmount, 'Vendor Acc Prepayment Allocation');

            if (vatAmount > 0 && vatPrepaymentId) {
                addCustomLine(vatPrepaymentId, false, vatAmount, 'VAT Prepayment Allocation');
            }

            // Gunakan paymentBase untuk offset total
            addCustomLine(prepaymentAccountId, true, paymentBase, 'Prepayment Offset Custom GL');

        } catch (e) {
            log.error('Custom GL Unexpected Error', e.toString());
        }
    }

    return {
        customizeGlImpact: customizeGlImpact
    };
});