/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {
    const btn = document.getElementById('tr_custpageworkflow252');
        console.log('btn', btn)
        if (btn) {
            btn.style.display = 'none';
        }
        const btnSec = document.getElementById('tr_secondarycustpageworkflow252');
        if (btnSec) {
            btnSec.style.display = 'none';
        }
        
        const btnReject = document.getElementById('tr_custpageworkflow253');
        if(btnReject){
            btnReject.style.display = 'none';
        }
        const btnRejectSec = document.getElementById('tr_secondarycustpageworkflow253');
        console.log('btnRejectSec', btnRejectSec)
        if(btnRejectSec){
            btnRejectSec.style.display = 'none';
        }
        const btnRejectBill = document.getElementById('tr_custpageworkflow286');
        if(btnRejectBill){
            btnRejectBill.style.display = 'none';
        }
        // const btnRejectBill2 = document.getElementById('tr_custpageworkflow291');
        // if(btnRejectBill2){
        //     btnRejectBill2.style.display = 'none';
        // }
        const btnApprovBill = document.getElementById('tr_custpageworkflow299');
        if(btnApprovBill){
            btnApprovBill.style.display = 'none';
        }
        const btnApprovBillSec = document.getElementById('tr_secondarycustpageworkflow299');
        if(btnApprovBillSec){
            btnApprovBillSec.style.display = 'none';
        }
        const btnRejectBillSec = document.getElementById('tr_secondarycustpageworkflow286');
        if(btnRejectBillSec){
            btnRejectBillSec.style.display = 'none';
        }
        //  const btnRejectBillSec2 = document.getElementById('tr_secondarycustpageworkflow291');
        // if(btnRejectBillSec2){
        //     btnRejectBillSec2.style.display = 'none';
        // }
        // TAR
        const btnAppTAR = document.getElementById('custpageworkflow545')
        if(btnAppTAR){
            btnAppTAR.style.display = 'none';
        }
        const btnAppTarSec = document.getElementById('secondarycustpageworkflow545');
        if(btnAppTarSec){
            btnAppTarSec.style.display = 'none';
        }
        const btnRecTAR = document.getElementById('custpageworkflow544');
        if(btnRecTAR){
            btnRecTAR.style.display = 'none';
        }
        const btnRecTARsec = document.getElementById('secondarycustpageworkflow544');
        if(btnRecTARsec){
            btnRecTARsec.style.display = 'none';
        }
    const pageInit = () => {

    };
    return { pageInit };
});
