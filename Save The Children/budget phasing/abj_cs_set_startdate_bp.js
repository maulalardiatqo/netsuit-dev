/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/record', 'N/ui/dialog', 'N/url', 'N/currentRecord', 'N/search', 'N/https'], (record, dialog, url, currentRecord, search, https) => {
    var rec = currentRecord.get()
    function formatBulanTahun(tanggal) {
        const bulanSingkat = [
            'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
            'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];

        const [, bulan, tahun] = tanggal.split('/');

        return `${bulanSingkat[parseInt(bulan, 10) - 1]} ${tahun}`;
    }
    function getIdPeriod(periodName){
        var perId 
        const accountingperiodSearchObj = search.create({
        type: "accountingperiod",
        filters:
        [
            ["periodname","is",periodName]
        ],
        columns:
        [
            search.createColumn({name: "periodname", label: "Name"}),
            search.createColumn({name: "startdate", label: "Start Date"}),
            search.createColumn({name: "enddate", label: "End Date"}),
            search.createColumn({name: "internalid", label: "Internal ID"})
        ]
        });
        const searchResultCount = accountingperiodSearchObj.runPaged().count;
        log.debug("accountingperiodSearchObj result count",searchResultCount);
        accountingperiodSearchObj.run().each(function(result){
            perId = result.getValue({
                name : "internalid"
            })
        return true;
        });
        return perId
    }
    function pageInit(context) {
       
    }
    function fieldChanged(context) {
        var fieldName = context.fieldId;
        if(fieldName == 'custrecord_stc_grant_module_prj_budg'){
            var grandModul = rec.getValue('custrecord_stc_grant_module_prj_budg');
            console.log('grandModul', grandModul);
            if(grandModul){
                var startDate
                var endDate
                const jobSearchObj = search.create({
                    type: "job",
                    filters:
                    [
                        ["internalid","anyof",grandModul]
                    ],
                    columns:
                    [
                        search.createColumn({name: "startdate", label: "Start Date"}),
                        search.createColumn({name: "enddate", label: "Project End Date"})
                    ]
                    });
                    const searchResultCount = jobSearchObj.runPaged().count;
                    log.debug("jobSearchObj result count",searchResultCount);
                    jobSearchObj.run().each(function(result){
                        startDate = result.getValue({
                            name : 'startdate'
                        })
                        endDate = result.getValue({
                            name : 'enddate'
                        })
                    return true;
                });
                console.log('startDate', startDate);
                console.log('endate', endDate);
                var namePeriodStart
                var nameEnd
                if(startDate){
                    namePeriodStart = formatBulanTahun(startDate)
                }
                if(endDate){
                    nameEnd = formatBulanTahun(endDate)
                }
                console.log('namePeriodStart',namePeriodStart)
                console.log('nameEnd', nameEnd)

                if(namePeriodStart){
                    var periodStart = getIdPeriod(namePeriodStart);
                    if(periodStart){
                        rec.setValue({
                            fieldId : 'custrecord_stc_start_date_prj_budg',
                            value : periodStart
                        })
                    }
                }
                if(nameEnd){
                    var periodEnd = getIdPeriod(nameEnd)
                    if(periodEnd){
                        rec.setValue({
                            fieldId : 'custrecord_stc_end_date_prj_budg',
                            value : periodEnd
                        })
                    }
                }
            }
        }
    }
    return{
        pageInit : pageInit,
        fieldChanged : fieldChanged
    }
});