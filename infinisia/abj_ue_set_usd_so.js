/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

define(["N/record", "N/search", "N/query"], function (record, search, query) {
    function afterSubmit(context) {
        try {
            var rec = context.newRecord;
        
            var recordLoad = record.load({
                type: rec.type,
                id: rec.id,
                isDynamic: true,
            });
            var sql = `
            SELECT
                currencyRate.exchangeRate AS exchange_rate,
                currencyRate.effectiveDate AS effective_date
            FROM
                currency
            JOIN
                currencyRate
            ON
                currency.id = currencyRate.transactioncurrency
            WHERE
                currency.id = 2
            AND
                currencyRate.effectiveDate = (
                    SELECT MAX(cr.effectiveDate)
                    FROM currencyRate cr
                    WHERE cr.transactioncurrency = currency.id
                )
            `;
        
            var queryResult = query.runSuiteQL({
                query: sql
            });
            
            var resultSet = queryResult.asMappedResults();
            if (resultSet.length > 0) {
                var exchangeRate = resultSet[0].exchange_rate;
                var effectiveDate = resultSet[0].effective_date;
                if (context.type === context.UserEventType.CREATE) {
                    
                    recordLoad.setValue({
                        fieldId: "custbody_abj_kurs_usd",
                        value: exchangeRate,
                        ignoreFieldChange: true,
                    });
                    var savetrans = recordLoad.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug("saveTrans", savetrans);
                
                }
                if(context.type === context.UserEventType.EDIT){
                    var trandate = recordLoad.getValue("trandate");  
                    var effectiveDate = resultSet[0].effective_date;  
                    
                    log.debug('Original Effective Date', effectiveDate);
                    log.debug('Original Trandate', trandate);
                    
                    var trandateObj = new Date(trandate);
                    var trandateFormatted = trandateObj.getDate() + '/' + (trandateObj.getMonth() + 1) + '/' + trandateObj.getFullYear();
                    
                    log.debug('Formatted Trandate', trandateFormatted);
                    
                    if (trandateFormatted === effectiveDate) {
                        log.debug('Tanggal sama');
                        recordLoad.setValue({
                            fieldId: "custbody_abj_kurs_usd",
                            value: exchangeRate,
                            ignoreFieldChange: true,
                        });
                        var savetrans = recordLoad.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true,
                        });
                        log.debug("saveTrans", savetrans);
                    } else {
                        log.debug('Tanggal tidak sama');
                    }
                    
                    
                }
            }
           
        }catch(e){
            log.debug('error',  e)
        }
    }
    function beforeLoad(context) {
        try {
            var form = context.form;
            var rec = context.newRecord;

            if (context.type === context.UserEventType.CREATE) {
                var sql = `
                SELECT
                    currencyRate.exchangeRate AS exchange_rate,
                    currencyRate.effectiveDate AS effective_date
                FROM
                    currency
                JOIN
                    currencyRate
                ON
                    currency.id = currencyRate.transactioncurrency
                WHERE
                    currency.id = 2
                AND
                    currencyRate.effectiveDate = (
                        SELECT MAX(cr.effectiveDate)
                        FROM currencyRate cr
                        WHERE cr.transactioncurrency = currency.id
                    )
                `;

                var queryResult = query.runSuiteQL({
                    query: sql
                });

                var resultSet = queryResult.asMappedResults();
                if (resultSet.length > 0) {
                    var exchangeRate = resultSet[0].exchange_rate;

                    rec.setValue({
                        fieldId: "custbody_abj_kurs_usd",
                        value: exchangeRate,
                        ignoreFieldChange: true,
                    });

                    log.debug("Exchange Rate set to", exchangeRate);
                }
            }
        } catch (e) {
            log.debug('error', e);
        }
    }
    return {
        beforeLoad : beforeLoad,
        afterSubmit: afterSubmit,
      };
    });