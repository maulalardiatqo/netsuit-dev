/**
 * Copyright (c) 2018 Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "N/record", "N/search", "N/url", "N/https", "N/query", "../../common/constants/Constants", "../gateway/BudgetValidationsGateway", "../useCase/BudgetValidationsUseCase", "N/currency", "N/runtime", "N/translation", "N/format"], function (_exports, record, search, url, https, query, _Constants, _BudgetValidationsGateway, _BudgetValidationsUseCase, currency, runtime, translation, format) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.saveRecord = _exports.pageInit = void 0;
  record = _interopRequireWildcard(record);
  search = _interopRequireWildcard(search);
  url = _interopRequireWildcard(url);
  https = _interopRequireWildcard(https);
  query = _interopRequireWildcard(query);
  _BudgetValidationsGateway = _interopRequireDefault(_BudgetValidationsGateway);
  _BudgetValidationsUseCase = _interopRequireDefault(_BudgetValidationsUseCase);
  currency = _interopRequireWildcard(currency);
  runtime = _interopRequireWildcard(runtime);
  translation = _interopRequireWildcard(translation);
  format = _interopRequireWildcard(format);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  var __spreadArrays = void 0 && (void 0).__spreadArrays || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) {
      s += arguments[i].length;
    }

    for (var r = Array(s), k = 0, i = 0; i < il; i++) {
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) {
        r[k] = a[j];
      }
    }

    return r;
  };

  var _createGateway = function _createGateway() {
    return new _BudgetValidationsGateway["default"]({
      dependencies: {
        'N/search': search,
        'N/record': record,
        'N/https': https,
        'N/runtime': runtime,
        'N/url': url,
        'N/query': query,
        'N/currency': currency,
        'N/translation': translation,
        'N/format': format
      },
      constants: _Constants.Constants
    });
  };

  var useCase = new _BudgetValidationsUseCase["default"]({
    dependencies: {
      budgetValidationsGateway: _createGateway()
    }
  });
  var budgetPreferencesObj = {};
  var budgetPreferencesFields = [];
  var fieldsAndSegmentsObj = {};

  var budgetControlRecordFields = useCase._BMUtils.initializeBudgetControlPref();

  var currentTransactionMode = '';
  var budgetType;
  var stdBudgetCategory;

  var pageInit = function pageInit(context) {
    currentTransactionMode = context.mode;
    var tranDate; // Populating Budget Date field value

    tranDate = new Date(context.currentRecord.getValue(_Constants.Constants.CUSTOM_TRANSACTION.CUSTOM_BUDGET.FIELDS.CUSTOM_BUDGET_TRAN_DATE).toString());
    tranDate.setDate(1);
    context.currentRecord.setValue({
      fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_DATE,
      value: tranDate
    });
    budgetPreferencesObj = useCase._BMUtils.getBudgetPreferences(_Constants.Constants.CUSTOM_SEARCH.FETCH_BUDGET_PREFERENCES);
    budgetType = budgetPreferencesObj['custrecord_bm_budgetvalidation_source'];
    stdBudgetCategory = budgetPreferencesObj['custrecord_bm_budget_category'];
    var prefBudgetColumns = budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_SEARCH_COLUMNS];

    if (prefBudgetColumns.length > 0) {
      prefBudgetColumns.split(',').forEach(function (filterPair) {
        var fieldSegLabelWithId = filterPair.split('|');
        budgetPreferencesFields.push(fieldSegLabelWithId[0]);
        fieldsAndSegmentsObj[fieldSegLabelWithId[0]] = fieldSegLabelWithId[1];
      });
    }

    var defaultBudgetControlRecordId = budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_CONTROL_INSTANCE]; // loading control record fields

    if (defaultBudgetControlRecordId) {
      budgetControlRecordFields = useCase._BudgetValidationUtils.loadBudgetControlRecordFromPreferences(defaultBudgetControlRecordId);
    }
  };

  _exports.pageInit = pageInit;

  var saveRecord = function saveRecord(context) {
    var currentRecord = context.currentRecord;
    var currentRecordId = currentRecord.id ? currentRecord.id.toString() : '';
    var recordType = currentRecord.type.toString();

    var transactionCurrency = useCase._BMUtils.getRecordFieldValue(currentRecord, _Constants.Constants.UTILS.FIELDS.CURRENCY).toString();

    var tranDateObj = useCase._BMUtils.getRecordFieldValue(currentRecord, _Constants.Constants.UTILS.FIELDS.TRANDATE);

    var transactionDate = useCase._BMUtils.getFormattedDate(tranDateObj, format.Type.DATE);

    if (!transactionDate) {
      return true;
    }

    var lineCountPO = currentRecord.getLineCount(_Constants.Constants.UTILS.SUBLIST_IDS.PURCHASE_ORDERS_SUBLIST);

    var poDocNum = useCase._BMUtils.getRecordFieldValue(currentRecord, _Constants.Constants.UTILS.FIELDS.PODOCNUM);

    var fromPurchaseOrder = poDocNum ? poDocNum.toString() : '';

    if (recordType === _Constants.Constants.UTILS.STANDARD_FIELDS.VENDORBILL && (fromPurchaseOrder || lineCountPO > 0)) {
      return true;
    }

    var subsidiary = useCase._BMUtils.getRecordFieldValue(currentRecord, _Constants.Constants.UTILS.STANDARD_FIELDS.SUBSIDIARY).toString();

    var _a = _Constants.Constants.TRANSLATIONS.TRANSLATION_COLLECTION,
        COLLECTION_ID = _a.ID,
        ALERT_MSG_YRLY_INVLD_TRAN_DATE = _a.KEYS.ALERT_MSG_YRLY_INVLD_TRAN_DATE;
    var exchangeRate = 1;

    if (useCase._BMUtils.isMultiCurrencyEnabled()) {
      exchangeRate = parseFloat(currentRecord.getValue(_Constants.Constants.UTILS.STANDARD_FIELDS.EXCHANGE_RATE).toString());
    }

    if (budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.PREF_ENABLE_BUDGET]) {
      var tranExpenseLinesObj = useCase._BMUtils.getTransactionLines(currentRecord, _Constants.Constants.UTILS.SUBLIST.EXPENSE, budgetPreferencesFields);

      var tranItemLinesObj = useCase._BMUtils.getTransactionLines(currentRecord, _Constants.Constants.UTILS.SUBLIST.ITEM, budgetPreferencesFields);

      var transactionLines = __spreadArrays(tranExpenseLinesObj, tranItemLinesObj);

      var budgetFields = useCase._BMUtils.initializeBudgetAndTranDet();

      budgetFields['transactionLinesObj'] = transactionLines;
      budgetFields['budgetPreferencesFields'] = budgetPreferencesFields;
      budgetFields['budgetPrefFieldsWithId'] = fieldsAndSegmentsObj;
      budgetFields['budgetPreferences'] = budgetPreferencesObj;
      budgetFields['budgetControlRecordFields'] = budgetControlRecordFields;
      budgetFields['currentRecordId'] = currentRecordId;
      budgetFields['contextMode'] = currentTransactionMode;
      budgetFields['exchangeRate'] = exchangeRate;
      budgetFields['transactionCurrency'] = transactionCurrency;
      budgetFields['transactionDate'] = transactionDate;
      var params = {
        recordDetails: budgetFields,
        budgetPreferencesObj: budgetPreferencesObj,
        subsidiary: subsidiary,
        tranDate: transactionDate
      };

      var budgetResultObj = useCase._BMUtils.callSaveSuiteLet(params);

      if (typeof budgetResultObj === 'boolean') {
        if (budgetResultObj === false) alert(useCase._BMUtils.getTranslationString(COLLECTION_ID, ALERT_MSG_YRLY_INVLD_TRAN_DATE));
        return budgetResultObj;
      }

      if (transactionDate) {
        var tranDate = useCase._BMUtils.getParsedDate(transactionDate, format.Type.DATE);

        tranDate.setDate(1);
        currentRecord.setValue({
          fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_DATE,
          value: tranDate
        });
      }

      if (budgetResultObj.hasOwnProperty('budgetPeriod')) {
        currentRecord.setValue({
          fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_PERIOD,
          value: budgetResultObj['budgetPeriod'].toString()
        });
      }

      if (!budgetResultObj['saveTransaction'] && budgetResultObj.hasOwnProperty('noBudgetNoSaveMsg')) {
        alert(budgetResultObj['noBudgetNoSaveMsg']); // Populating Timestamp in Last Budget Check field

        currentRecord.setValue({
          fieldId: _Constants.Constants.TRAN_BODY_FIELDS.LAST_BUDGET_CHECK,
          value: new Date()
        });
        return budgetResultObj['saveTransaction'];
      } //  Set transaction lines only if transaction cannot be saved


      if (budgetResultObj['tranLineFieldsToBeUpdated'].length > 0 && !budgetResultObj['saveTransaction']) {
        useCase._BMUtils.setTransactionLines(currentRecord, budgetResultObj, 'CS');
      }

      if (budgetResultObj['transactionSaveMsgFlag']) {
        alert(budgetResultObj['transactionSaveMsg']);
      }

      if (budgetResultObj['saveTransaction']) {
        if (budgetResultObj['atleastOneBudgetFound']) {
          if (budgetResultObj['atleastOneBudgetExceeded']) {
            currentRecord.setValue({
              fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE,
              value: budgetControlRecordFields.custrecord_bm_budget_head_msg
            });
          } else {
            currentRecord.setValue({
              fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE,
              value: budgetControlRecordFields.custrecord_bm_status_header_msg
            });
          }
        } else {
          currentRecord.setValue({
            fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE,
            value: ''
          });
        }
      } // Populating Timestamp in Last Budget Check field


      currentRecord.setValue({
        fieldId: _Constants.Constants.TRAN_BODY_FIELDS.LAST_BUDGET_CHECK,
        value: new Date()
      });
      return budgetResultObj['saveTransaction'];
    } else {
      return true;
    }
  };

  _exports.saveRecord = saveRecord;
});