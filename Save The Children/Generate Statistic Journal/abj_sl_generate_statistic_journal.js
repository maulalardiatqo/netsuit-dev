/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/log', 'N/record', 'N/search'], (log, record, search) => {
    
    const onRequest = (context) => {
        if (context.request.method !== 'GET') {
            context.response.write(JSON.stringify({ status: 'error', message: 'Invalid request method.' }));
            return;
        }

        try {
            const recordId = context.request.parameters.recordId;
            log.debug('Processing Record ID', recordId);

            if (!recordId) throw new Error("No Record ID provided.");

            // 1. Load Custom Record Schedule
            const loadRec = record.load({
                type: "customrecord_statistical_schedule",
                id: recordId
            });

            const periodId = loadRec.getValue('custrecord_sch_period');
            if (!periodId) throw new Error("Period is empty on this record.");

            // 2. Ambil Start Date & End Date dari Accounting Period
            const periodFields = search.lookupFields({
                type: record.Type.ACCOUNTING_PERIOD,
                id: periodId,
                columns: ['startdate', 'enddate']
            });

            const startDate = periodFields.startdate;
            const endDate = periodFields.enddate;

            log.debug('Period Dates', `Start: ${startDate}, End: ${endDate}`);

            const searchData = search.load({
                id: 'customsearch572'
            });

            let filters = searchData.filters;
            filters.push(search.createFilter({
                name: 'startdate',
                operator: search.Operator.ONORAFTER,
                values: [startDate]
            }));

            filters.push(search.createFilter({
                name: 'enddate',
                operator: search.Operator.ONORBEFORE,
                values: [endDate]
            }));
            searchData.filters = filters;

            const searchResult = searchData.run().getRange({ start: 0, end: 1000 });

            if (searchResult.length === 0) {
                throw new Error("No data found in search for the selected period.");
            }
            log.debug('searchResult', searchResult)
            const newJeId = createJournalEntry(searchResult, periodId); 
            if(newJeId){
                var recCreate = record.create({
                    type : 'customrecord_line_statiscal_schedule'
                });
                recCreate.setValue({
                    fieldId : 'custrecord_sch_header',
                    value : recordId
                })
                recCreate.setValue({
                    fieldId : 'custrecord_sch_date',
                    value : new Date()
                })
                recCreate.setValue({
                    fieldId : 'custrecord_sch_journal_entry',
                    value : newJeId
                })
                recCreate.save();
            }
            context.response.write(JSON.stringify({
                status: 'success',
                jeId: newJeId
            }));

        } catch (e) {
            log.error('Error in Suitelet', e.message);
            context.response.write(JSON.stringify({
                status: 'error',
                message: e.message
            }));
        }
    };


    const createJournalEntry = (results, periodId) => {
        if(results.length > 0){
            var allDataLine = []
            results.forEach((row) => {
                if (row.columns.length > 1) {
                    var totalHour = row.getValue(row.columns[0]);
                    var costCenter = row.getValue(row.columns[1]);
                    var projectCode = row.getValue(row.columns[2]);
                    var sof = row.getValue(row.columns[3]);
                    var drc = row.getValue(row.columns[4]);
                    var dea = row.getValue(row.columns[5]);
                    var empName = row.getValue(row.columns[7]);
                    allDataLine.push({
                        totalHour : totalHour,
                        costCenter : costCenter,
                        projectCode : projectCode,
                        sof : sof,
                        drc : drc,
                        dea : dea,
                        empName : empName
                    })
                }
            })
            log.debug('allDataLine', allDataLine)
            if(allDataLine.length > 0){
                const jeRec = record.create({ type: "statisticaljournalentry", isDynamic: true });
                jeRec.setValue({ fieldId: 'conversionrate', value: '1' });
                jeRec.setValue({ fieldId: 'createddate', value: new Date()});
                jeRec.setValue({ fieldId: 'currency', value: '1'});
                jeRec.setValue({ fieldId: 'postingperiod', value: periodId});
                jeRec.setValue({ fieldId: 'unit', value: '1'});
                jeRec.setValue({ fieldId: 'unitstype', value: '1'});
                allDataLine.forEach((data)=>{
                    var account = '723'
                    var totalHour = data.totalHour
                    var costCenter = data.costCenter
                    var projectCode = data.projectCode
                    var sof = data.sof
                    var dea = data.dea
                    var drc = data.drc
                    var empName = data.empName
                    jeRec.selectNewLine({
                        sublistId : 'line'
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'account',
                        value : account
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'debit',
                        value : totalHour
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'entity',
                        value : empName
                    })
                     jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'department',
                        value : costCenter
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'class',
                        value : projectCode
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'cseg_stc_sof',
                        value : sof
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'cseg_stc_drc_segmen',
                        value : drc
                    })
                    jeRec.setCurrentSublistValue({
                        sublistId : 'line',
                        fieldId : 'cseg_stc_segmentdea',
                        value : dea
                    })
                    
                    jeRec.commitLine({
                        sublistId : 'line'
                    })
                })
                var idJe = jeRec.save();
                log.debug('idJe', idJe)
                return idJe
            }
            
        }
        
    };

    return { onRequest };
});