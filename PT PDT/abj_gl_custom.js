/**
 * @NApiVersion 2.x
 * @NScriptType CustomGlPlugin
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/log'], function (record, search, log) {

    // Helper: Cari Internal ID Account berdasarkan Nama (String)
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
            var taxCodeId = txn.getValue({ fieldId: 'custbody_pdt_tax_code' });
            var vendorAcc = txn.getValue({ fieldId: 'custbody_pdt_prepayment_account' });
            
            // KONDISI 1 & 2: Ambil ID Account dan Exchange Rate
            var mainAccountId = txn.getValue({ fieldId: 'account' });
            var exchangeRateStr = txn.getValue({ fieldId: 'exchangerate' });
            var exchangeRate = parseFloat(exchangeRateStr) || 1; // Default ke 1 jika tidak ada/kosong

            if (!taxCodeId || !vendorAcc || payment <= 0 || !mainAccountId) {
                log.debug('Custom GL Skipped', 'Missing tax code, vendor account, main account, or payment <= 0');
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

            // Validasi akun VAT hanya jika rate > 0
            if (rate > 0) {
                if (!vatPrepaymentText) {
                    log.error('Custom GL Error', 'Tax Code incomplete (acct1 is missing for non-zero rate)');
                    return;
                }
                
                // PROSES LOOKUP STRING -> INTERNAL ID
                vatPrepaymentId = getAccountIdByName(vatPrepaymentText);
                if (!vatPrepaymentId) {
                    log.error('Custom GL Error', 'Account Name "' + vatPrepaymentText + '" not found in Chart of Accounts. Ensure the name matches exactly.');
                    return;
                }
            }

            // KONDISI 2: Perhitungan dikalikan dengan Exchange Rate
            var paymentBase = payment * exchangeRate;
            var vendorAmountBase = paymentBase;
            var vatAmountBase = 0;

            if (rate > 0) {
                // Kalkulasi pada Base Amount agar tidak ada selisih sen/rounding issue
                vendorAmountBase = Math.round(((100 / (100 + rate)) * paymentBase) * 100) / 100;
                vatAmountBase = Math.round((paymentBase - vendorAmountBase) * 100) / 100;
            }

            var stdLines = transactionContext.standardLines;
            if (stdLines.count < 2) {
                log.error('Custom GL Error', 'Standard GL lines count < 2');
                return;
            }

            var defaultEntity = null;
            var defaultDepartment = null;
            var defaultClass = null;
            var defaultLocation = null;

            // LINE 3 & 4: REVERSAL DEFAULT NETSUITE GL
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
                    // Ambil dimensi (entity, location, dll) untuk di-copy ke Custom GL
                    defaultEntity = stdLine.entityId;
                    defaultDepartment = stdLine.departmentId;
                    defaultClass = stdLine.classId;
                    defaultLocation = stdLine.locationId;
                } else if (stdLine.creditAmount > 0) {
                    reverseLine.debitAmount = stdLine.creditAmount;
                }
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

            // LINE 5: VENDOR ACCOUNT (Amount x Exchange Rate)
            addCustomLine(vendorAcc, true, vendorAmountBase, 'Vendor Acc Prepayment Allocation');

            // LINE 6: VAT PREPAYMENT ACCOUNT - Hanya jika VAT ada (Amount x Exchange Rate)
            if (vatAmountBase > 0 && vatPrepaymentId) {
                addCustomLine(vatPrepaymentId, true, vatAmountBase, 'VAT Prepayment Allocation');
            }

            // LINE 7 (atau 6 jika VAT 0): PREPAYMENT ACCOUNT OFFSET
            // KONDISI 1: Menggunakan mainAccountId dari field id="account"
            addCustomLine(mainAccountId, false, paymentBase, 'Prepayment Offset Custom GL');

        } catch (e) {
            log.error('Custom GL Unexpected Error', e.toString());
        }
    }

    return {
        customizeGlImpact: customizeGlImpact
    };
});