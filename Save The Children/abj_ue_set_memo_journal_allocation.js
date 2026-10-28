/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/record', 'N/log', 'N/format'], (search, record, log, format) => {

    const afterSubmit = (context) => {
        try {
            const { type, UserEventType, newRecord } = context;
            const allowedEvents = [UserEventType.CREATE, UserEventType.EDIT, UserEventType.COPY];
            
            if (!allowedEvents.includes(type)) {
                return;
            }
            
            const journalRecord = record.load({
                type: newRecord.type,
                id: newRecord.id,
                isDynamic: false
            });
            
            const lineCount = journalRecord.getLineCount({ sublistId: 'line' });
            log.debug('lineCount', lineCount)
            let sourceAccount = null;
            let destinationAccount = null;
            let validLines = [];
            const parentExpenseAlloc = journalRecord.getValue('parentexpensealloc');
            log.debug('parentExpenseAlloc', parentExpenseAlloc)
            if (parentExpenseAlloc) {
                for (let i = 0; i < lineCount; i++) {
                    validLines.push(i);
                    
                    const creditAmount = journalRecord.getSublistValue({ sublistId: 'line', fieldId: 'credit', line: i });
                    const debitAmount = journalRecord.getSublistValue({ sublistId: 'line', fieldId: 'debit', line: i });
                    const accountId = journalRecord.getSublistValue({ sublistId: 'line', fieldId: 'account', line: i });

                    if (creditAmount && parseFloat(creditAmount) > 0) {
                        sourceAccount = accountId; 
                    }
                    
                    if (debitAmount && parseFloat(debitAmount) > 0) {
                        destinationAccount = accountId; 
                    }
                }
            }
            log.debug('validLines', validLines)
            if (!sourceAccount || !destinationAccount || validLines.length === 0) {
                return; 
            }
            log.debug('sourceAccount', sourceAccount)
            log.debug('destinationAccount', destinationAccount)
            const mappingSearch = search.create({
                type: 'customrecord_mapping_account_allocation',
                filters: [
                    ['custrecord_account_source', 'anyof', sourceAccount],
                    'AND',
                    ['custrecord_account_destination', 'anyof', destinationAccount]
                ],
                columns: ['custrecord_memo']
            });

            const searchResults = mappingSearch.run().getRange({ start: 0, end: 1 });
            log.debug('searchResults', searchResults)
            if (searchResults && searchResults.length > 0) {
                const memoValue = searchResults[0].getValue('custrecord_memo');

                if (memoValue) {
                    var prefix = journalRecord.getText({ fieldId: 'postingperiod' });
                    prefix = prefix.toUpperCase();
                    log.debug('prefix', prefix)
                    const finalMemo = prefix ? `${memoValue} ${prefix}` : memoValue;
                    log.debug('finalMemo', finalMemo)
                    for (let i = 0; i < validLines.length; i++) {
                        journalRecord.setSublistValue({
                            sublistId: 'line',
                            fieldId: 'memo',
                            line: validLines[i],
                            value: finalMemo
                        });
                    }
                    
                    journalRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true 
                    });
                }
            }

        } catch (error) {
            log.error('Error on afterSubmit UserEvent', error.message);
        }
    };

    return { afterSubmit };
});