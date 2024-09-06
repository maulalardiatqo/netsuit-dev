/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/https', 'N/url', 'N/redirect', 'N/file', 'N/encode', 'N/search', 'N/record', 'N/runtime', 'N/format', 'N/task', 'N/query'],
	function (ui, https, url, redirect, file, encode, search, record, runtime, format, task, query) {

		function onRequest(context) {

			var form = ui.createForm({
				title: 'IntercoTrans DN/GR Track',
				hideNavBar: false
			});

			var fieldEndDate = form.addField({
				id: 'filter_end_date',
				type: ui.FieldType.DATE,
				label: 'As Of'
			});
			var fieldCompany = form.addField({
				id: 'filter_company',
				type: ui.FieldType.SELECT,
				label: 'Company',
				source: 'subsidiary'
			});

			form.addSubmitButton('Run Report');
			context.response.writePage({
				pageObject: form
			});

			if (context.request.method == 'POST') {

				fieldEndDate.defaultValue = context.request.parameters.filter_end_date;
				fieldCompany.defaultValue = context.request.parameters.filter_company;

				var end_date = context.request.parameters.filter_end_date || null;
				var company_id = context.request.parameters.filter_company || null;

				log.debug('parameter', 'end_date : ' + end_date + ' - company_id : ' + company_id);

				try {

					var query_basic = "select so.intercotransaction, tranline.createdfrom, tranacc.account, sum(tranacc.amount) amount, "
						+ "sum(tranacc.debit) debit, sum(tranacc.credit) credit "
						+ "from transaction tran, "
						+ "transactionline tranline, "
						+ "transaction so, "
						+ "transactionaccountingline tranacc "
						+ "where "
						+ "tran.id = tranline.transaction "
						+ "and "
						+ "( "
						+ "	(tranline.expenseaccount = 112 and tran.recordtype = 'itemreceipt') or "
						+ "	( "
						+ "		(tran.recordtype = 'vendorbill' or tran.recordtype = 'itemfulfillment' or tran.recordtype = 'invoice') and "
						+ "		tranline.linesequencenumber = 0 and "
						+ "		tranacc.amount != 0 "
						+ "	) "
						+ " ) "
						+ "and tranline.createdfrom = so.id "
						+ "and so.intercotransaction > 0 "
						+ "and tran.id = tranacc.transaction "
						+ "and tranacc.posting = 'T' "
						+ "and (tranacc.account = 112 or tranacc.account = 849) ";

					var query_interco = "";
					var start_date = '1/1/2021';
					if (end_date != null && company_id != null) {
						log.debug('parameter', 'end_date dan company');
						query_interco = query_basic + "and tran.trandate between '" + start_date + "' and '" + end_date + "' "
							+ "and tranline.subsidiary = " + company_id + " "
							+ "group by so.intercotransaction, tranline.createdfrom, tranacc.account "
							+ "order by so.intercotransaction, tranline.createdfrom";
					}
					else {
						log.debug('parameter', 'end_date only');
						query_interco = query_basic + "and tran.trandate between '" + start_date + "' and '" + end_date + "' "
							+ "group by so.intercotransaction, tranline.createdfrom, tranacc.account "
							+ "order by so.intercotransaction, tranline.createdfrom";
					}

					log.debug('query_interco', query_interco);

					var queryResults = query.runSuiteQL({
						query: query_interco
					}).asMappedResults();
					log.debug('queryResults : ', queryResults.length);

					var sublist = form.addSublist({ id: 'trans_sublist', type: ui.SublistType.LIST, label: 'List Transaction' });
					sublist.addField({ id: 'number', type: ui.FieldType.TEXT, label: 'No.' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'trandate', type: ui.FieldType.TEXT, label: 'DATE' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'type', type: ui.FieldType.TEXT, label: 'TYPE' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					//sublist.addField({id: 'status',type: ui.FieldType.TEXT,label: 'STATUS'}).updateDisplayType({displayType: ui.FieldDisplayType.INLINE});
					sublist.addField({ id: 'company_id', type: ui.FieldType.TEXT, label: 'COMPANY ID' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'entity', type: ui.FieldType.TEXT, label: 'CUSTOMER/VENDOR' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'doc_number', type: ui.FieldType.TEXT, label: 'DOCUMENT NUMBER' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'po_number', type: ui.FieldType.TEXT, label: 'PO NUMBER' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'so_number', type: ui.FieldType.TEXT, label: 'SO NUMBER' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'currency', type: ui.FieldType.TEXT, label: 'CURRENCY' }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'amount', type: ui.FieldType.CURRENCY, label: 'AMOUNT', align: ui.LayoutJustification.RIGHT }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'amount_debit', type: ui.FieldType.CURRENCY, label: 'AMOUNT DEBIT', align: ui.LayoutJustification.RIGHT }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
					sublist.addField({ id: 'amount_credit', type: ui.FieldType.CURRENCY, label: 'AMOUNT CREDIT', align: ui.LayoutJustification.RIGHT }).updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

					var line_number = 0;
					var total = 0;
					var number = 1;
					if (queryResults.length > 0) {
						for (var x = 0; x < queryResults.length; x++) {
							var rslt = queryResults[x];
							var amount = rslt.amount;
							var account = rslt.account;
							var interco = rslt.intercotransaction;
							var createdfrom = rslt.createdfrom;
							var amt_debit = rslt.debit;
							var amt_credit = rslt.credit;

							log.debug('data interco group', 'interco : ' + interco + ' - createdfrom : ' + createdfrom + ' - amt_debit : ' + amt_debit + ' - amt_credit : ' + amt_credit);

							if (amount != 0 && account == 849) {
								//log.debug('cek', 'cek item fulfillment & invoice');
								var cek_basic_query = "select tran.recordtype, tran.id, tran.tranid, BUILTIN.DF(tran.entity) as entity, "
									+ "BUILTIN.DF(so.intercotransaction) as po_number, so.tranid, BUILTIN.DF(tran.currency) as currency, "
									+ "tran.trandate, so.intercotransaction, BUILTIN.DF(tranline.subsidiary) as subsidiary, "
									+ "tranline.createdfrom, tranacc.account, sum(tranacc.amount) amount, sum(tranacc.debit) debit, sum(tranacc.credit) credit "
									+ "from transaction tran, "
									+ "transactionline tranline, "
									+ "transaction so, "
									+ "transactionaccountingline tranacc "
									+ "where "
									+ "tran.id = tranline.transaction and "
									+ "( "
									+ "	(tran.recordtype = 'vendorbill' or tran.recordtype = 'itemfulfillment' or tran.recordtype = 'invoice') "
									+ "	and tranline.linesequencenumber = 0 and tranacc.amount != 0 "
									+ ") and "
									+ "tranline.createdfrom = so.id and "
									+ "tranline.createdfrom = " + createdfrom + " and "
									+ "so.intercotransaction > 0 and "
									+ "tran.id = tranacc.transaction and "
									+ "tranacc.posting = 'T' and "
									+ "tranacc.account = 849 ";
								var cek_query = "";
								if (end_date != null && company_id != null) {
									cek_query = cek_basic_query + "and tran.trandate between '" + start_date + "' and '" + end_date + "' "
										+ "and tranline.subsidiary = " + company_id + " "
										+ "group by tran.recordtype, tran.id, tran.tranid, BUILTIN.DF(tran.entity), "
										+ "BUILTIN.DF(so.intercotransaction), so.tranid, BUILTIN.DF(tran.currency), tran.trandate, so.intercotransaction, "
										+ "tranline.createdfrom, tranacc.account, BUILTIN.DF(tranline.subsidiary) "
										+ "order by tran.trandate";
								}
								else {
									cek_query = cek_basic_query + "and tran.trandate between '" + start_date + "' and '" + end_date + "' "
										+ "group by tran.recordtype, tran.id, tran.tranid, BUILTIN.DF(tran.entity), "
										+ "BUILTIN.DF(so.intercotransaction), so.tranid, BUILTIN.DF(tran.currency), tran.trandate, so.intercotransaction, "
										+ "tranline.createdfrom, tranacc.account, BUILTIN.DF(tranline.subsidiary) "
										+ "order by tran.trandate";
								}

								var queryResults_cek = query.runSuiteQL({
									query: cek_query
								}).asMappedResults();
								//log.debug('queryResults_cek : '+ queryResults_cek.length, queryResults_cek);

								if (queryResults_cek.length > 0) {
									var total_amt_fulfill = 0;
									var total_amt_inv = 0;
									for (var a = 0; a < queryResults_cek.length; a++) {
										if (queryResults_cek[a].recordtype == 'itemfulfillment') {
											total_amt_fulfill = parseFloat(total_amt_fulfill) + parseFloat(queryResults_cek[a].amount || 0);
											selisih = parseFloat(selisih) + parseFloat(queryResults_cek[a].amount || 0);
										}
										else if (queryResults_cek[a].recordtype == 'invoice') {
											total_amt_inv = parseFloat(total_amt_inv) + parseFloat(queryResults_cek[a].amount || 0);
										}
										var selisih = parseFloat(total_amt_fulfill) + parseFloat(total_amt_inv);
										log.debug('selisih', selisih);

										if (queryResults_cek.length == 1 && queryResults_cek[a].recordtype == 'itemfulfillment'){
											total = parseFloat(total) + parseFloat(queryResults_cek[a].amount || 0);
											sublist.setSublistValue({ id: 'number', line: line_number, value: addCommas(number) });
											if (queryResults_cek[a].tranid) {
												sublist.setSublistValue({ id: 'doc_number', line: line_number, value: queryResults_cek[a].tranid });
											}
											if (queryResults_cek[a].trandate) {
												sublist.setSublistValue({ id: 'trandate', line: line_number, value: queryResults_cek[a].trandate });
											}
											if (queryResults_cek[a].recordtype) {
												sublist.setSublistValue({ id: 'type', line: line_number, value: queryResults_cek[a].recordtype });
											}
											if (queryResults_cek[a].currency) {
												sublist.setSublistValue({ id: 'currency', line: line_number, value: queryResults_cek[a].currency });
											}
											if (queryResults_cek[a].entity) {
												sublist.setSublistValue({ id: 'entity', line: line_number, value: queryResults_cek[a].entity });
											}
											if (queryResults_cek[a].subsidiary) {
												sublist.setSublistValue({ id: 'company_id', line: line_number, value: queryResults_cek[a].subsidiary });
											}
											if (queryResults_cek[a].tranid_0) {
												sublist.setSublistValue({ id: 'so_number', line: line_number, value: queryResults_cek[a].tranid_0 });
											}
											if (queryResults_cek[a].po_number) {
												var po_ = queryResults_cek[a].po_number;
												var split_po = po_.split('#'); //Purchase Order #PO-ID02-0000000095
												var po_number = split_po[1];
												sublist.setSublistValue({ id: 'po_number', line: line_number, value: po_number });
											}
											if (queryResults_cek[a].amount) {
												sublist.setSublistValue({ id: 'amount', line: line_number, value: queryResults_cek[a].amount });
											}
											if (queryResults_cek[a].debit) {
												sublist.setSublistValue({ id: 'amount_debit', line: line_number, value: queryResults_cek[a].debit });
											}
											if (queryResults_cek[a].credit) {
												sublist.setSublistValue({ id: 'amount_credit', line: line_number, value: queryResults_cek[a].credit });
											}
											line_number = line_number + 1;
											number = number + 1;
										}else if (selisih > 0 && queryResults_cek[a].recordtype == 'invoice') {
											total = parseFloat(total) + parseFloat(selisih);
											sublist.setSublistValue({ id: 'number', line: line_number, value: addCommas(number) });
											if (queryResults_cek[a-1].tranid) {
												sublist.setSublistValue({ id: 'doc_number', line: line_number, value: queryResults_cek[a-1].tranid });
											}

											if (queryResults_cek[a-1].trandate) {
												sublist.setSublistValue({ id: 'trandate', line: line_number, value: queryResults_cek[a-1].trandate });
											}
											if (queryResults_cek[a-1].recordtype) {
												sublist.setSublistValue({ id: 'type', line: line_number, value: queryResults_cek[a-1].recordtype });
											}
											if (queryResults_cek[a-1].currency) {
												sublist.setSublistValue({ id: 'currency', line: line_number, value: queryResults_cek[a-1].currency });
											}
											if (queryResults_cek[a-1].entity) {
												sublist.setSublistValue({ id: 'entity', line: line_number, value: queryResults_cek[a-1].entity });
											}
											if (queryResults_cek[a-1].subsidiary) {
												sublist.setSublistValue({ id: 'company_id', line: line_number, value: queryResults_cek[a-1].subsidiary });
											}
											if (queryResults_cek[a-1].tranid_0) {
												sublist.setSublistValue({ id: 'so_number', line: line_number, value: queryResults_cek[a-1].tranid_0 });
											}
											if (queryResults_cek[a-1].po_number) {
												var po_ = queryResults_cek[a-1].po_number;
												var split_po = po_.split('#'); //Purchase Order #PO-ID02-0000000095
												var po_number = split_po[1];
												sublist.setSublistValue({ id: 'po_number', line: line_number, value: po_number });
											}
											if (selisih > 0) {
												sublist.setSublistValue({ id: 'amount', line: line_number, value: selisih });
											}
											if (queryResults_cek[a-1].debit) {
												sublist.setSublistValue({ id: 'amount_debit', line: line_number, value: selisih });
											}
											line_number = line_number + 1;
											number = number + 1;
										}
									}

								}

							} else if (amount != 0 && account == 112) {
								log.debug('cek', 'cek item gr & bill');
								var cek_basic_query = "select tran.recordtype, tran.id, tran.tranid, BUILTIN.DF(tran.entity) as entity, "
									+ "BUILTIN.DF(po.intercotransaction) as so_number, po.tranid, BUILTIN.DF(tran.currency) as currency, "
									+ "tran.trandate, po.intercotransaction, BUILTIN.DF(tranline.subsidiary) as subsidiary, "
									+ "tranline.createdfrom, tranacc.account, sum(tranacc.amount) amount, sum(tranacc.debit) debit, sum(tranacc.credit) credit "
									+ "from transaction tran, "
									+ "transactionline tranline, "
									+ "transaction po, "
									+ "transactionaccountingline tranacc "
									+ "where "
									+ "tran.id = tranline.transaction "
									+ "and "
									+ "( "
									+ "	(tranline.expenseaccount = 112 and tran.recordtype = 'itemreceipt') or "
									+ "	( "
									+ "		tran.recordtype = 'vendorbill' and "
									+ "		tranline.linesequencenumber = 0 and "
									+ "		tranacc.amount != 0 "
									+ "	) "
									+ ") "
									+ "and tranline.createdfrom = po.id "
									+ "and tranline.createdfrom = " + createdfrom + " "
									+ "and po.intercotransaction > 0 "
									+ "and tran.id = tranacc.transaction "
									+ "and tranacc.posting = 'T' "
									+ "and (tranacc.account = 112 or tranacc.account = 849) ";
								var cek_query = "";
								if (end_date != null && company_id != null) {
									cek_query = cek_basic_query + "and tran.trandate between '" + start_date + "' and '" + end_date + "' "
										+ "and tranline.subsidiary = " + company_id + " "
										+ "group by tran.recordtype, tran.id, tran.tranid, BUILTIN.DF(tran.entity), "
										+ "BUILTIN.DF(po.intercotransaction), po.tranid, BUILTIN.DF(tran.currency), tran.trandate, po.intercotransaction, "
										+ "tranline.createdfrom, tranacc.account, BUILTIN.DF(tranline.subsidiary) "
										+ "order by tran.trandate";
								}
								else {
									cek_query = cek_basic_query + "and tran.trandate between '" + start_date + "' and '" + end_date + "' "
										+ "group by tran.recordtype, tran.id, tran.tranid, BUILTIN.DF(tran.entity), "
										+ "BUILTIN.DF(po.intercotransaction), po.tranid, BUILTIN.DF(tran.currency), tran.trandate, po.intercotransaction, "
										+ "tranline.createdfrom, tranacc.account, BUILTIN.DF(tranline.subsidiary) "
										+ "order by tran.trandate";
								}
								var queryResults_cek = query.runSuiteQL({
									query: cek_query
								}).asMappedResults();
								//log.debug('queryResults_cek : '+ queryResults_cek.length, queryResults_cek);

								if (queryResults_cek.length > 0) {
									var total_amt_gr = 0;
									var total_amt_bill = 0;
									for (var a = 0; a < queryResults_cek.length; a++) {
										if (queryResults_cek[a].recordtype == 'itemreceipt') {
											total_amt_gr = parseFloat(total_amt_gr) + parseFloat(queryResults_cek[a].amount || 0);
										}
										else if (queryResults_cek[a].recordtype == 'vendorbill') {
											total_amt_bill = parseFloat(total_amt_bill) + parseFloat(queryResults_cek[a].amount || 0);
										}

										var selisih = parseFloat(total_amt_gr) + parseFloat(total_amt_bill);
										
										if(queryResults_cek.length == 1 && queryResults_cek[a].recordtype == 'itemreceipt'){
											total = parseFloat(total) + parseFloat(queryResults_cek[a].amount || 0);
											sublist.setSublistValue({ id: 'number', line: line_number, value: addCommas(number) });
											if (queryResults_cek[a].tranid) {
												sublist.setSublistValue({ id: 'doc_number', line: line_number, value: queryResults_cek[a].tranid });
											}

											if (queryResults_cek[a].trandate) {
												sublist.setSublistValue({ id: 'trandate', line: line_number, value: queryResults_cek[a].trandate });
											}
											if (queryResults_cek[a].recordtype) {
												sublist.setSublistValue({ id: 'type', line: line_number, value: queryResults_cek[a].recordtype });
											}
											if (queryResults_cek[a].currency) {
												sublist.setSublistValue({ id: 'currency', line: line_number, value: queryResults_cek[a].currency });
											}
											if (queryResults_cek[a].entity) {
												sublist.setSublistValue({ id: 'entity', line: line_number, value: queryResults_cek[a].entity });
											}
											if (queryResults_cek[a].subsidiary) {
												sublist.setSublistValue({ id: 'company_id', line: line_number, value: queryResults_cek[a].subsidiary });
											}
											if (queryResults_cek[a].tranid_0) {
												sublist.setSublistValue({ id: 'po_number', line: line_number, value: queryResults_cek[a].tranid_0 });
											}
											if (queryResults_cek[a].so_number) {
												var so_ = queryResults_cek[a].so_number;
												var split_so = so_.split('#'); //Sales Order #SO-2021-ID01-000023
												var so_number = split_so[1];
												sublist.setSublistValue({ id: 'so_number', line: line_number, value: so_number });
											}
											if (queryResults_cek[a].amount) {
												sublist.setSublistValue({ id: 'amount', line: line_number, value: queryResults_cek[a].amount });
											}
											if (queryResults_cek[a].debit) {
												sublist.setSublistValue({ id: 'amount_debit', line: line_number, value: queryResults_cek[a].debit });
											}
											if (queryResults_cek[a].credit) {
												sublist.setSublistValue({ id: 'amount_credit', line: line_number, value: queryResults_cek[a].credit });
											}
											line_number = line_number + 1;
											number = number + 1;
										}else if (selisih != 0 && queryResults_cek[a].recordtype == 'vendorbill') {
											total = parseFloat(total) + parseFloat(selisih);
											sublist.setSublistValue({ id: 'number', line: line_number, value: addCommas(number) });
											if (queryResults_cek[a-1].tranid) {
												sublist.setSublistValue({ id: 'doc_number', line: line_number, value: queryResults_cek[a-1].tranid });
											}

											if (queryResults_cek[a-1].trandate) {
												sublist.setSublistValue({ id: 'trandate', line: line_number, value: queryResults_cek[a-1].trandate });
											}
											if (queryResults_cek[a-1].recordtype) {
												sublist.setSublistValue({ id: 'type', line: line_number, value: queryResults_cek[a-1].recordtype });
											}
											if (queryResults_cek[a-1].currency) {
												sublist.setSublistValue({ id: 'currency', line: line_number, value: queryResults_cek[a-1].currency });
											}
											if (queryResults_cek[a-1].entity) {
												sublist.setSublistValue({ id: 'entity', line: line_number, value: queryResults_cek[a-1].entity });
											}
											if (queryResults_cek[a-1].subsidiary) {
												sublist.setSublistValue({ id: 'company_id', line: line_number, value: queryResults_cek[a-1].subsidiary });
											}
											if (queryResults_cek[a-1].tranid_0) {
												sublist.setSublistValue({ id: 'po_number', line: line_number, value: queryResults_cek[a-1].tranid_0 });
											}
											if (queryResults_cek[a-1].so_number) {
												var so_ = queryResults_cek[a-1].so_number;
												var split_so = so_.split('#'); //Sales Order #SO-2021-ID01-000023
												var so_number = split_so[1];
												sublist.setSublistValue({ id: 'so_number', line: line_number, value: so_number });
											}
											if (queryResults_cek[a-1].amount) {
												sublist.setSublistValue({ id: 'amount', line: line_number, value: selisih });
											}
											if (queryResults_cek[a-1].debit) {
												sublist.setSublistValue({ id: 'amount_debit', line: line_number, value: queryResults_cek[a-1].debit });
											}
											if (queryResults_cek[a-1].credit) {
												sublist.setSublistValue({ id: 'amount_credit', line: line_number, value: queryResults_cek[a-1].credit });
											}
											line_number = line_number + 1;
											number = number + 1;
										}
									}

								}
							}
						}
					}
					sublist.setSublistValue({ id: 'doc_number', line: line_number, value: 'TOTAL' });
					sublist.setSublistValue({ id: 'amount', line: line_number, value: total });
					log.debug('total', total);

					form.addButton({
						id: 'btn_generate_excel',
						label: 'Download Excel',
						functionName: "downloadExcel()"
					});
				}
				catch (e) {
					if (e instanceof nlobjError) {
						log.debug('error', e.getCode() + '\n' + e.getDetails());
					} else {
						log.debug('unexpected', e.toString());
					}
				}

			}
			form.clientScriptModulePath = 'SuiteScripts/LIS - Report DN GR custom CS.js';
			context.response.writePage(form);
		}

		return {
			onRequest: onRequest
		};
	});

function escapeCSV(val) {
	if (!val) return '';
	if (!(/[",\s]/).test(val)) return val;
	val = val.replace(/"/g, '""');
	return '"' + val + '"';
}

function addCommas(n) {
	var rx = /(\d+)(\d{3})/;
	return String(n).replace(/^\d+/, function (w) {
		while (rx.test(w)) {
			w = w.replace(rx, '$1,$2');
		}
		return w;
	});
}