/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([], function () {

    function pageInit(context) {
        console.log('pageInit');

        // kasih delay biar DOM sublist keburu render
        setTimeout(() => {
            hidePRSublist();
        }, 1000);
    }

    function hidePRSublist() {
        const prTable = document.querySelector('#recmachcustrecord_iss_pr_parent__tab'); 
        if (!prTable) {
            console.log('PR sublist table not found');
            return;
        }

        const headers = prTable.querySelectorAll('thead tr th');
        let hideIndexes = [];

        headers.forEach((th, idx) => {
            const label = th.innerText.trim();
            if (label === 'Customer' || label === 'Customer Name') {
                hideIndexes.push(idx);
                th.style.display = 'none'; // hide header
                console.log('Hide header:', label);
            }
        });

        if (hideIndexes.length > 0) {
            const rows = prTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                hideIndexes.forEach(i => {
                    const cell = row.children[i];
                    if (cell) {
                        cell.style.display = 'none';
                    }
                });
            });
        }

        // hide tombol edit
        const editBtn = document.querySelector('#edit');
        if (editBtn) editBtn.style.display = 'none';
    }

    return {
        pageInit: pageInit
    };
});
