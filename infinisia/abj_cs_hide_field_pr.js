/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define([], function () {
     var tableCek = document.getElementById('recmachcustrecord_iss_pr_parent__tab');
     console.log('tableCek', tableCek);
    // Cari header kolom Customer
        const header = document.querySelector('td.listheadertd[data-label="Customer"]');

        if (header) {
            // Dapatkan index kolom Customer
            const colIndex = Array.from(header.parentNode.children).indexOf(header);

            // Sembunyikan header kolom Customer
            header.style.display = "none";

            // Sembunyikan semua <td> di body sesuai index
            document.querySelectorAll("table tr").forEach(tr => {
                const td = tr.children[colIndex];
                if (td) {
                    td.style.display = "none";
                }
            });
        }


    function pageInit(context) {
        console.log('pageInit');
    }

   
    return {
        pageInit: pageInit
    };
});
