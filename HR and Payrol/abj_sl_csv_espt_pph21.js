/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define(['N/ui/serverWidget', 'N/search', 'N/record'], function (serverWidget, search, record) {
    function onRequest(context) {
        var contextRequest = context.request;
        var form = serverWidget.createForm({
            title: 'CSV eSPT PPh 21'
        });
        if (context.request.method === 'GET') {
            var monthName = form.addField({
                id: 'custpage_pph_select_month',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Bulan',
            });
            monthName.addSelectOption({
                value: '',
                text: ''
            });
            var monthNamesIndonesia = [
                'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ];
            var monthNamesEnglish = [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ];
            for (var i = 1; i <= 12; i++) {
                monthName.addSelectOption({
                    value: monthNamesEnglish[i - 1],
                    text: monthNamesIndonesia[i - 1]
                });
            }
            var yearName = form.addField({
                id: 'custpage_pph_select_year',
                type: serverWidget.FieldType.SELECT,
                label: 'Pilih Tahun',
            });
            yearName.addSelectOption({
                value: '',
                text: ''
            });
            for (var year = 2020; year <= 2030; year++) {
                yearName.addSelectOption({
                    value: year.toString(),
                    text: year.toString()
                });
            }

            form.addSubmitButton({
                label: 'Download 1721 I Bulanan'
            });
            context.response.writePage(form);
        }  else if (context.request.method === 'POST'){
            try{
                var bulan = context.request.parameters.custpage_pph_select_month
                var tahun = context.request.parameters.custpage_pph_select_year
                var bulanTahun = bulan + " " + tahun + " " + "-"
                log.debug('bulanTahun', bulanTahun);

                var searchSlip = search.create({
                    type : 'customrecord_msa_slip_gaji',
                    filters : [{
                        name : 'custrecord_abj_msa_period_gaji',
                        operator : 'contains',
                        values : bulanTahun
                    }],
                    columns:
                    [
                    search.createColumn({
                        name: "id",
                        sort: search.Sort.ASC,
                        label: "ID"
                    }),
                    search.createColumn({name: "custrecord_abj_msa_employee_slip", label: "Employee"}),
                    search.createColumn({name: "custrecord_abj_msa_pph21perusahaan", label: "PPh21 Ditanggung Perusahaan"}),
                    search.createColumn({name: "custrecord_abj_msa_pph21karyawan", label: "PPH21 Ditanggung Karyawan"}),
                    search.createColumn({name: "custrecord_abj_msa_thp", label: "Take Home Pay"}),
                    search.createColumn({name: "custrecord_abj_msa_bruto", label: "Gaji Bruto"})
                    ]
                });
                var searchSlipSet = searchSlip.runPaged().count;
                if(searchSlipSet > 0){
                    var allData = [];
                    searchSlip.run().each(function(result){
                        var employee = result.getValue({
                            name : 'custrecord_abj_msa_employee_slip'
                        });
                        var pphPerusahaan = result.getValue({
                            name : 'custrecord_abj_msa_pph21perusahaan'
                        });
                        var pphKaryawan = result.getValue({
                            name : 'custrecord_abj_msa_pph21karyawan'
                        });
                        var bruto = result.getValue({
                            name : 'custrecord_abj_msa_bruto'
                        });

                        allData.push({
                            employee : employee,
                            pphPerusahaan : pphPerusahaan,
                            pphKaryawan : pphKaryawan,
                            bruto : bruto
                        })
                        return true
                        
                    });
                    log.debug('alldata', allData );
                    allData.forEach((data) => {
                        var employee = data.employee;
                        var pphPerusahaan = data.pphPerusahaan;
                        var pphKaryawan = data.pphKaryawan;
                        var bruto = data.bruto;

                        if(pphPerusahaan != "" || pphKaryawan != ""){
                            log.debug('ada pph')
                        }
                    })
                }
            }catch(e){
                log.debug('error', e)
            }
        }
    }
    return {
        onRequest: onRequest
    };
});
