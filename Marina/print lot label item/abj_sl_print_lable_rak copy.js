/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/record", "N/url", "N/runtime", "N/currency", "N/error", "N/config", "N/file"], function (serverWidget, search, record, url, runtime, currency, error, config, file) {
    function onRequest(context) {
        var dataBarcodeString = context.request.parameters.custscript_list_item_to_print;
        var dataBarcode = JSON.parse(dataBarcodeString);
        log.debug("dataBarcode", dataBarcode);

        // Initialize jsPDF library
        var jsPDF = loadJsPdfLibrary(); // Function to load jsPDF library

        // Array to store all PDF pages generated
        var pdfPages = [];

        // Loop through each item in dataBarcode
        dataBarcode.forEach(function (item) {
            // Create PDF pages based on countLabel
            for (var i = 0; i < item.countLabel; i++) {
                var pdfPage = buildPdfPage(item, i + 1, jsPDF); // Pass item, page number, and jsPDF instance

                // Add PDF page to array
                pdfPages.push(pdfPage);
            }
        });

        // Combine all PDF pages into a single PDF file
        var combinedPdf = combinePdfPages(pdfPages, jsPDF);

        // Write combined PDF file as response
        var pdfFile = savePdfToFile(combinedPdf);

        // Send PDF file as response
        context.response.writeFile(pdfFile, true);
    }

    // Function to load jsPDF library
    function loadJsPdfLibrary() {
        // Replace 'YOUR_JSPDF_FILE_INTERNAL_ID' with the internal ID of your uploaded jsPDF file
        var jspdfFile = file.load({ id: 'YOUR_JSPDF_FILE_INTERNAL_ID' });
        var jspdfContent = jspdfFile.getContents();
        eval(jspdfContent); // Evaluate the jsPDF content to make it available in SuiteScript
        return jsPDF; // Return the jsPDF instance
    }

    // Function to build PDF page for each item
    function buildPdfPage(item, pageNumber, jsPDF) {
        var pdf = new jsPDF();
        
        // Build PDF content here based on item and pageNumber
        var content = buildPdfContent(item, pageNumber);

        // Set content on the page
        pdf.text(content, 10, 10); // Adjust position as needed

        return pdf;
    }

    // Function to build PDF content for each item and page
    function buildPdfContent(item, pageNumber) {
        var content = "";
        content += item.internalID + ' / ' + item.upcCode + ' / ' + formatDate(new Date()) + '\n';
        content += item.itemName + '\n';
        content += 'Range Harga:\n';

        item.rangeHarga.forEach(function (hargaItem) {
            var batasVolume = hargaItem.batasVolume == 0 ? 1 : hargaItem.batasVolume;
            content += batasVolume + ' PCS - Rp. ' + hargaItem.harga + '\n';
        });

        return content;
    }

    // Function to format date
    function formatDate(date) {
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        
        if (day < 10) {
            day = '0' + day;
        }
        if (month < 10) {
            month = '0' + month;
        }
        
        return day + '-' + month + '-' + year;
    }

    // Function to combine multiple PDF pages into one PDF file
    function combinePdfPages(pdfPages, jsPDF) {
        var combinedPdf = new jsPDF();
        
        pdfPages.forEach(function (pdfPage, index) {
            if (index > 0) {
                combinedPdf.addPage(); // Add new page for each subsequent page
            }
            combinedPdf.internal.pages[index] = pdfPage.internal.pages[1];
        });

        return combinedPdf;
    }

    // Function to save PDF file to NetSuite File Cabinet
    function savePdfToFile(pdf) {
        var pdfName = 'CombinedPDF_' + new Date().getTime() + '.pdf';
        var pdfFile = file.create({
            name: pdfName,
            fileType: file.Type.PDF,
            contents: pdf.output(),
            folder: 'YOUR_PDF_FOLDER_INTERNAL_ID' // Replace with internal ID of your desired folder in File Cabinet
        });

        var pdfFileId = pdfFile.save();
        var savedPdfFile = file.load({ id: pdfFileId });

        return savedPdfFile;
    }

    return {
        onRequest: onRequest,
    };
});


