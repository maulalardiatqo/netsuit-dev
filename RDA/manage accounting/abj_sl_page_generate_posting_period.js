/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/task', 'N/search', 'N/log', 'N/record'], function (serverWidget, task, search, log, record) {

    function onRequest(context) {
        if (context.request.method === 'GET') {
            var form = serverWidget.createForm({
                title: 'Generate Accounting Period'
            });

            var monthField = form.addField({
                id: 'custpage_month',
                type: serverWidget.FieldType.SELECT,
                label: 'Month'
            });

            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < months.length; i++) {
                monthField.addSelectOption({
                    value: months[i], 
                    text: months[i]    
                });
            }

            var yearField = form.addField({
                id: 'custpage_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Year'
            });

            var currentYear = new Date().getFullYear();

            for (let i = currentYear - 5; i <= currentYear + 10; i++) {
                yearField.addSelectOption({
                    value: i.toString(),
                    text: i.toString()
                });
            }

            form.addSubmitButton({
                label: 'Generate'
            });

            context.response.writePage(form);

        } else {
            try{
                var selectedMonth = context.request.parameters.custpage_month;
                var selectedYear = context.request.parameters.custpage_year;
    
                log.debug('selectedMonth', selectedMonth);
                log.debug('selectedYear', selectedYear);
    
                function convertToDate(dateString) {
                    var dateParts = dateString.split('/');
                    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]); 
                }
    
                function cekData(data) {
                    var accountingperiodSearchObj = search.create({
                        type: "accountingperiod",
                        filters: [
                            ["periodname", "is", data]
                        ],
                        columns: [
                            search.createColumn({name: "periodname", label: "Name"}),
                            search.createColumn({name: "internalid", label: "Internal ID"}),
                            search.createColumn({name: "fiscalcalendar", label: "fiscalcalendar"})
                        ]
                    });
                    var searchResults = accountingperiodSearchObj.run().getRange({ start: 0, end: 1 });
    
                    if (searchResults.length > 0) {
                        var periodName = searchResults[0].getValue({ name: 'periodname' });
                        var internalId = searchResults[0].getValue({ name: 'internalid' });
                        var fiscal = searchResults[0].getValue({name : 'fiscalcalendar'});
                        log.debug('fiscal', fiscal)
    
                        log.debug('Period Name:', periodName);
                        log.debug('Internal ID:', internalId);
    
                        return {
                            periodName: periodName,
                            internalId: internalId
                        };
                    } else {
                        log.debug('No results found.');
                        return null;
                    }
                }
    
                function getStartYear(year) {
                    let startDate = `01/01/${year}`;
                   
                    return startDate
                }
                function getEndYear(year){
                    let endDateObj = new Date(year, 11, 31);
                    
                    let endDate = endDateObj.toLocaleDateString('en-GB');
                    return endDate
                }
                function generateDates(monthYear) {
                    const monthNames = [
                        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                    ];
                    let [monthName, year] = monthYear.split(" ");
                    year = parseInt(year);
                    let monthIndex = monthNames.indexOf(monthName);
                    if (monthIndex === -1) {
                        throw new Error("Nama bulan tidak valid");
                    }
                    let lastDate = new Date(year, monthIndex + 1, 0).getDate();
                    let dates = [];
                    for (let day = 1; day <= lastDate; day++) {
                        let dayString = day.toString().padStart(2, '0');
                        let monthString = (monthIndex + 1).toString().padStart(2, '0');
                        dates.push(`${dayString}/${monthString}/${year}`);
                    }
                    let startDate = dates[0];  
                    let endDate = dates[dates.length - 1]; 
                
                    return { dates, startDate, endDate };
                }
                
                
                var cekYear = cekData('FY' + ' ' +selectedYear);
                if(!cekYear || cekYear == '' || cekYear == null){
                    var startYear = convertToDate(getStartYear(selectedYear));
    
                    var endYear = convertToDate(getEndYear(selectedYear));
                    var fiscalSet = 1
                    
                    var createRecordYear = record.create({
                        type: "accountingperiod",
                        isDynamic: true,
                    });
                    var periodName = 'FY' + ' ' + selectedYear
                    log.debug('startYear', startYear)
                    log.debug('endYear', endYear)
                    createRecordYear.setValue({
                        fieldId: "isyear",
                        value: true,
                        ignoreFieldChange: true,
                    });
                    createRecordYear.setValue({
                        fieldId: "isquarter",
                        value: false,
                        ignoreFieldChange: true,
                    });
                    createRecordYear.setValue({
                        fieldId: "periodname",
                        value: periodName,
                        ignoreFieldChange: true,
                    });
                    createRecordYear.setValue({
                        fieldId: "startdate",
                        value: startYear,
                        ignoreFieldChange: true,
                    });
                    createRecordYear.setValue({
                        fieldId: "enddate",
                        value: endYear,
                        ignoreFieldChange: true,
                    });
                    createRecordYear.setValue({
                        fieldId: "fiscalcalendar",
                        value: fiscalSet,
                        ignoreFieldChange: true,
                    });
                    createRecordYear.setValue({
                        fieldId: "isposting",
                        value: false,
                        ignoreFieldChange: true,
                    });
                  
                    var saveYear = createRecordYear.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveYear', saveYear);

                    var cekDate = generateDates(selectedMonth + ' ' + selectedYear);
                    var allDate = cekDate.dates
                    log.debug('allDate', allDate);
                    var startDateMonth = convertToDate(cekDate.startDate)
                    log.debug('startDateMonth', startDateMonth)
                    var endDateMonth = convertToDate(cekDate.endDate)
                    log.debug('endDateMonth', endDateMonth)

                    // create month
                    var createMonth = record.create({
                        type: "accountingperiod",
                        isDynamic: true,
                    });
                    var periodNameMonth = selectedMonth + ' ' + selectedYear
                    createMonth.setValue({
                        fieldId: "isposting",
                        value: false,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "isyear",
                        value: false,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "isquarter",
                        value: true,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "periodname",
                        value: periodNameMonth,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "startdate",
                        value: startDateMonth,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "enddate",
                        value: endDateMonth,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "fiscalcalendar",
                        value: fiscalSet,
                        ignoreFieldChange: true,
                    });
                    createMonth.setValue({
                        fieldId: "parent",
                        value: saveYear,
                        ignoreFieldChange: true,
                    });
                    var saveMonth = createMonth.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true,
                    });
                    log.debug('saveMonth', saveMonth)

                }else{
                    var cekMonth = cekData(selectedMonth + ' ' + selectedYear);
                }
                log.debug('cekYear', cekYear)
                log.debug('cekMonth', cekMonth)
            }catch(e){
                log.debug('error', e)
            }
           

        }
    }

    return {
        onRequest: onRequest
    };
});