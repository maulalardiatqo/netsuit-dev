/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

define(['N/record', 'N/search', 'N/ui/dialog', 'N/currentRecord', 'N/url'], function(record, search, dialog, currentRecord, url) {
    function printPengajuan() {
        var records = currentRecord.get();
        console.log("test in function");
        var id = records.id;
        var createPDFURL = url.resolveScript({
            scriptId: 'customscript_abj_sl_print_pengajuan_dana',
            deploymentId: 'customdeploy_abj_sl_print_pengajuan_dana',
            returnExternalUrl: false
        })
        console.log("id",id);
        console.log("urlpdf", createPDFURL);
        createPDFURL += '&id=' +  id;
            if (createPDFURL) {
                newWindow = window.open(createPDFURL);
            }
    }
    function saveRecord(context) {
        var rec = context.currentRecord;
        var cekApprovalLevel = rec.getValue('custrecord_approval_level');
        console.log('cekApprovalLevel', cekApprovalLevel)
        if(cekApprovalLevel && cekApprovalLevel.includes('Pending Setup COA')){
            console.log('masuk kondisi')
            var cekLine = rec.getLineCount({
                sublistId : 'recmachcustrecord_fund_journal'
            })
            console.log('cekLine', cekLine)
            if(cekLine <= 0){
                alert('please fill journal tab');
                return false
            }else{
                var totalAmountJournal = 0
                var totalAMountHead = rec.getValue('custrecord_fund_total_amt_realisasi')
                var totalDebit = 0;
                var totalCredit = 0;
                for(var i = 0; i < cekLine; i++){
                    var debitAmt = rec.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_j_debit',
                        line : i
                    })
                    if(debitAmt){
                        totalDebit = Number(totalDebit) + Number(debitAmt)
                    }
                    var credit = rec.getSublistValue({
                        sublistId : 'recmachcustrecord_fund_journal',
                        fieldId : 'custrecord_fund_credit',
                        line : i
                    })
                    if(credit){
                        totalCredit = Number(totalCredit) + Number(credit)
                    }
                }
                if(totalDebit != totalCredit){
                    alert('total Debit And Total Credit Must Balance');
                    return false
                }else{
                    if(totalAMountHead != totalDebit){
                        alert('total amount in journal must balance with total amount Realisasi');
                        return false
                    }else{
                        return true
                    }
                }
            }
            
        }
        return true
    }
    function deleteRecord(){
        var records = currentRecord.get();
        var id = records.id;
        var lineReq = records.getLineCount({
            sublistId : 'recmachcustrecord_fund_head'
        })
        var allIdLine = [];
        var allJournalLine =[];
        if(lineReq > 0){
            for(var i = 0; i < lineReq; i ++){
                var idLine = records.getSublistValue({
                    sublistId : 'recmachcustrecord_fund_head',
                    fieldId : 'id',
                    line : i
                });
                allIdLine.push(idLine)
            }
        }

        var journalReq = records.getLineCount({
            sublistId : 'recmachcustrecord_fund_journal'
        })
        if(journalReq > 0){
            for(var j = 0; j < journalReq; j++){
                var idJournal = records.getSublistValue({
                    sublistId : 'recmachcustrecord_fund_journal',
                    fieldId : 'id',
                    line : i
                });
                allJournalLine.push(idJournal)
            }
        }
        if (allIdLine.length > 0) {
            allIdLine.forEach(function (childId) {
                try {
                    record.delete({
                        type: 'customrecord_line_request_fund',
                        id: childId
                    });
                } catch (e) {
                    log.error("Delete Line Request Failed", e);
                }
            });
        }
        if (allJournalLine.length > 0) {
            allJournalLine.forEach(function (jid) {
                try {
                    record.delete({
                        type: 'customrecord_fund_journal_tab',
                        id: jid
                    });
                } catch (e) {
                    log.error("Delete Journal Line Failed", e);
                }
            });
        }
    }
    return{
        saveRecord : saveRecord,
        printPengajuan : printPengajuan,
        deleteRecord : deleteRecord
    }
})