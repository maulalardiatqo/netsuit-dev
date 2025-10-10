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
        // TER
        const btnAppTer = document.getElementById('custpageworkflow927');
        if(btnAppTer){
            btnAppTer.style.display = 'none';
        }
        const btnAppTerSec = document.getElementById('secondarycustpageworkflow927');
        if(btnAppTerSec){
            btnAppTerSec.style.display = 'none';
        }

        const btnRejTer = document.getElementById('custpageworkflow928');
        if(btnRejTer){
            btnRejTer.style.display = 'none';
        }
         const btnRejTerSec = document.getElementById('secondarycustpageworkflow928');
        if(btnRejTerSec){
            btnRejTerSec.style.display = 'none';
        }
        // approval FA
        const btnAppFA = document.getElementById('custpageworkflow292');
        console.log('btnAppFA', btnAppFA)
        if(btnAppFA){
            btnAppFA.style.display = 'none';
        }
        const btnRejFA = document.getElementById('custpageworkflow291');
        if(btnRejFA){
            btnRejFA.style.display = 'none';
        }
        const btnAppFASec = document.getElementById('secondarycustpageworkflow292');
        if(btnAppFASec){
            btnAppFASec.style.display = 'none';
        }
        const btnRejFASec = document.getElementById('secondarycustpageworkflow291');
        if(btnRejFASec){
            btnRejFASec.style.display = 'none';
        }

        // expense report
        const btnAppExp = document.getElementById('custpageworkflow340');
        if(btnAppExp){
            btnAppExp.style.display = 'none';
        }
        const btnRejExp = document.getElementById('custpageworkflow341');
        if(btnRejExp){
            btnRejExp.style.display = 'none';
        }
        const btnAppExpSec = document.getElementById('secondarycustpageworkflow340');
        if(btnAppExpSec){
            btnAppExpSec.style.display = 'none';
        }
        const btnRejSec = document.getElementById('secondarycustpageworkflow341');
        if(btnRejSec){
            btnRejSec.style.display = 'none';
        }
        const btnAppExpFa = document.getElementById('custpageworkflow957');
        if(btnAppExpFa){
            btnAppExpFa.style.display = 'none';
        }
        const btnRejExpFa = document.getElementById('custpageworkflow958');
        if(btnRejExpFa){
            btnRejExpFa.style.display = 'none';
        }
        const btnAppExpFaSec = document.getElementById('secondarycustpageworkflow957');
        if(btnAppExpFaSec){
            btnAppExpFaSec.style.display = 'none';
        }
        const btnRejExpFaSec = document.getElementById('secondarycustpageworkflow958');
        if(btnRejExpFaSec){
            btnRejExpFaSec.style.display = 'none';
        }

    const pageInit = () => {

    };
    return { pageInit };
});
