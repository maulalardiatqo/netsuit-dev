/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */

define(['N/ui/serverWidget', 'N/record', 'N/search'], function (serverWidget, record, search) {
  
    function onRequest(context) {
      if (context.request.method === 'GET') {
        var form = serverWidget.createForm({
          title: 'Bagian Dan Pekerjaan'
        });
  
        var bagianSubtab = form.addSublist({
          id: 'custrecord_bagian_tab',
          type: serverWidget.SublistType.LIST,
          label: 'Bagian'
        });
        bagianSubtab.addField({
            id: 'custrecord_bagian_name',
            type: serverWidget.FieldType.TEXT,
            label: 'Nama Bagian'
        });

        var bagianSearch = search.create({
          type: 'customrecord_bagian',
          columns: ['custrecord_bagian_name'] 
        });
        var bagianData = bagianSearch.run().getRange({ start: 0, end: 100 }); 
        for (var i = 0; i < bagianData.length; i++) {
          bagianSubtab.setSublistValue({
            id: 'custrecord_bagian_name',
            line: i,
            value: bagianData[i].getValue('custrecord_bagian_name')
          });
        }
        
        var departementSubtab = form.addSublist({
          id: 'custrecord_departement_tab',
          type: serverWidget.SublistType.LIST,
          label: 'Departement'
        });
        departementSubtab.addField({
            id: 'custrecord_nama_departement',
            type: serverWidget.FieldType.TEXT,
            label: 'Nama Departement'
        });

        var departementSearch = search.create({
          type: 'customrecord_departement',
          columns: ['custrecord_nama_departement'] 
        });
        var departementData = departementSearch.run().getRange({ start: 0, end: 100 });

        for (var j = 0; j < departementData.length; j++) {
          departementSubtab.setSublistValue({
            id: 'custrecord_nama_departement',
            line: j,
            value: departementData[j].getValue('custrecord_nama_departement')
          });
        }

        var jobTitleSubtab = form.addSublist({
          id: 'custrecord_job_title_tab',
          type: serverWidget.SublistType.LIST,
          label: 'Job Title'
        });
        jobTitleSubtab.addField({
            id: 'custrecord_job_title',
            type: serverWidget.FieldType.TEXT,
            label: 'Nama Job Title'
        });

        var jobTitleSearch = search.create({
          type: 'customrecord_abj_job_title',
          columns: ['custrecord_job_title'] 
        });
        var jobTitleData = jobTitleSearch.run().getRange({ start: 0, end: 100 }); 

        for (var k = 0; k < jobTitleData.length; k++) {
          jobTitleSubtab.setSublistValue({
            id: 'custrecord_job_title',
            line: k,
            value: jobTitleData[k].getValue('custrecord_job_title')
          });
        }
  
        context.response.writePage(form);
      }
    }
  
    return {
      onRequest: onRequest
    };
});
