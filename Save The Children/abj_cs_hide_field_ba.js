/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define([], () => {

    try {
        var headerApprover = document.querySelector('td[data-label="Approver"]');
        if (headerApprover) {
            headerApprover.style.setProperty('display', 'none', 'important');
            
            var columnIndex = headerApprover.cellIndex;
            
            var tableEl = headerApprover.closest('table');
            if (tableEl) {
                var rows = tableEl.querySelectorAll('tr');
                rows.forEach(function(row) {
                    if (row.cells[columnIndex]) {
                        row.cells[columnIndex].style.setProperty('display', 'none', 'important');
                    }
                });
            }
        }

        var headerStatus = document.querySelector('td[data-label="Approval Status "]');
        console.log('headerStatus', headerStatus)
        if (headerStatus) {
            headerStatus.style.setProperty('display', 'none', 'important');
            
            var columnIndexStatus = headerStatus.cellIndex;
            var tableElStatus = headerStatus.closest('table');
            if (tableElStatus) {
                var rowsStatus = tableElStatus.querySelectorAll('tr');
                rowsStatus.forEach(function(row) {
                    if (row.cells[columnIndexStatus]) {
                        row.cells[columnIndexStatus].style.setProperty('display', 'none', 'important');
                    }
                });
            }
        }

        console.log('DOM Manipulation Sukses: Kolom Approver & Approval Status Berhasil Disembunyikan.');
    } catch (e) {
        console.error('Gagal eksekusi DOM manipulation:', e.message);
    }
    const pageInit = (scriptContext) => {
        console.log('cek')
    };

    

    return {
        pageInit: pageInit
    };
});