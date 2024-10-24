/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "N/record", "N/search", "N/url", "N/https", "N/runtime", "N/query", "N/currency", "N/format", "N/translation", "../../common/constants/Constants", "../gateway/BudgetValidationsGateway", "../useCase/BudgetValidationsUseCase", "N/cache"], function (_exports, record, search, url, https, runtime, query, currency, format, translation, _Constants, _BudgetValidationsGateway, _BudgetValidationsUseCase, cache) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.beforeSubmit = void 0;
  record = _interopRequireWildcard(record);
  search = _interopRequireWildcard(search);
  url = _interopRequireWildcard(url);
  https = _interopRequireWildcard(https);
  runtime = _interopRequireWildcard(runtime);
  query = _interopRequireWildcard(query);
  currency = _interopRequireWildcard(currency);
  format = _interopRequireWildcard(format);
  translation = _interopRequireWildcard(translation);
  _BudgetValidationsGateway = _interopRequireDefault(_BudgetValidationsGateway);
  _BudgetValidationsUseCase = _interopRequireDefault(_BudgetValidationsUseCase);
  cache = _interopRequireWildcard(cache);

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

  var accountingPeriodGlobal;

  var _createGateway = function _createGateway() {
    return new _BudgetValidationsGateway["default"]({
      dependencies: {
        'N/search': search,
        'N/record': record,
        'N/url': url,
        'N/https': https,
        'N/runtime': runtime,
        'N/query': query,
        'N/currency': currency,
        'N/format': format,
        'N/translation': translation
      },
      constants: _Constants.Constants
    });
  };

  var useCase = new _BudgetValidationsUseCase["default"]({
    dependencies: {
      budgetValidationsGateway: _createGateway()
    }
  });

  var _getBudgetPreferenceFields = function _getBudgetPreferenceFields(budgetPreferencesObj) {
    var budgetPreferencesFields = [];
    var fieldsAndSegmentsObj = {};
    var prefBudgetColumns = budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_SEARCH_COLUMNS];

    if (prefBudgetColumns.length > 0) {
      prefBudgetColumns.split(',').forEach(function (filterPair) {
        var fieldSegLabelWithId = filterPair.split('|');
        budgetPreferencesFields.push(fieldSegLabelWithId[0]);
        fieldsAndSegmentsObj[fieldSegLabelWithId[0]] = fieldSegLabelWithId[1];
      });
    }

    return {
      budgetPreferencesFields: budgetPreferencesFields,
      fieldsAndSegmentsObj: fieldsAndSegmentsObj
    };
  };

  var _getBudgetControlRecordFields = function _getBudgetControlRecordFields(budgetPreferencesObj) {
    var budgetControlRecordFields = useCase._BMUtils.initializeBudgetControlPref();

    var defaultBudgetControlRecordId = budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_CONTROL_INSTANCE]; // loading control record fields

    if (defaultBudgetControlRecordId) {
      budgetControlRecordFields = useCase._BudgetValidationUtils.loadBudgetControlRecordFromPreferences(defaultBudgetControlRecordId);
    }

    return budgetControlRecordFields;
  };

  var _validateLinesAndSetData = function _validateLinesAndSetData(params, newRecord, lineCount, budgetControlRecordFields, globalNameIdMappingDataStore) {
    var segregateData = useCase.segregateRequestData(params, globalNameIdMappingDataStore);
    var userTransactionData = segregateData[0];
    var budgetTransactionData = segregateData[1];
    accountingPeriodGlobal = useCase._BMQueries.getAccountingPeriodSDED();
    var finalOutput = useCase.processValidations(userTransactionData, budgetTransactionData, globalNameIdMappingDataStore, accountingPeriodGlobal);

    if (finalOutput['tranLineFieldsToBeUpdated'].length > 0) {
      useCase._BMUtils.setTransactionLines(newRecord, finalOutput, '');
    }

    if (!finalOutput['saveTransaction']) {
      throw Error(finalOutput['csvErrorMsg']);
    }

    if (finalOutput['saveTransaction']) {
      if (finalOutput['atleastOneBudgetFound']) {
        if (finalOutput['atleastOneBudgetExceeded']) {
          newRecord.setValue({
            fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE,
            value: budgetControlRecordFields.custrecord_bm_budget_head_msg
          });
        } else {
          newRecord.setValue({
            fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE,
            value: budgetControlRecordFields.custrecord_bm_status_header_msg
          });
        }
      } else {
        newRecord.setValue({
          fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_STATUS_MESSAGE,
          value: ''
        });
      }
    }

    newRecord.setValue({
      fieldId: _Constants.Constants.TRAN_BODY_FIELDS.LAST_BUDGET_CHECK,
      value: new Date()
    });
    return finalOutput['saveTransaction'];
  };

  var _setDateFields = function _setDateFields(newRecord, fiscalCalendar, multiCalendarEnabled) {
    var MONTH = _Constants.Constants.UTILS.PERIOD_TYPES.MONTH;
    var tranDate;
    var periodObj;
    tranDate = newRecord.getValue(_Constants.Constants.CUSTOM_TRANSACTION.CUSTOM_BUDGET.FIELDS.CUSTOM_BUDGET_TRAN_DATE).toString();

    var parsedTranDate = useCase._BMUtils.getParsedDate(tranDate, format.Type.DATE);

    parsedTranDate.setDate(1);
    newRecord.setValue({
      fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_DATE,
      value: parsedTranDate
    });

    if (tranDate) {
      var periods = useCase._BMQueries.getFinancialPeriodsForFiscalCal(fiscalCalendar, MONTH, multiCalendarEnabled);

      if (periods && periods.length > 0) {
        periodObj = useCase._BMUtils.fetchTranDateFY(periods, tranDate);
      }
    }

    newRecord.setValue({
      fieldId: _Constants.Constants.TRAN_BODY_FIELDS.BUDGET_PERIOD,
      value: periodObj.id ? periodObj.id : ''
    });
    return periodObj;
  };

  var beforeSubmit = function beforeSubmit(context) {
    if (useCase._BMUtils.getExecutionContext() === runtime.ContextType.CSV_IMPORT) {
      var newRecord = context.newRecord;
      var SUBSIDIARY = _Constants.Constants.UTILS.STANDARD_FIELDS.SUBSIDIARY;
      var fiscalCalendar = void 0;
      var finYearObj = [];
      var subsidiaryId = newRecord.getValue({
        fieldId: SUBSIDIARY
      }).toString();

      var subsidiaryPreferences = useCase._BMQueries.getSubsidiaryPref(subsidiaryId);

      var fisCalValue = subsidiaryPreferences[_Constants.Constants.CUSTOM_RECORD.SUBSIDIARY.FISCAL_CALENDAR];

      if (!!fisCalValue) {
        fiscalCalendar = fisCalValue;
      }

      var multiCalendarEnabled = useCase._BMUtils.isMultiCalendarEnabled();

      var period = _setDateFields(newRecord, fiscalCalendar, multiCalendarEnabled);

      if (useCase._BMUtils.checkPOToVB(newRecord, context)) {
        return true;
      }

      var exchangeRate = 1;

      var multiCurrencyEnabled = useCase._BMUtils.isMultiCurrencyEnabled();

      if (multiCurrencyEnabled) {
        exchangeRate = parseFloat(newRecord.getValue(_Constants.Constants.UTILS.STANDARD_FIELDS.EXCHANGE_RATE).toString());
      }

      var lineCount = newRecord.getLineCount({
        sublistId: _Constants.Constants.UTILS.SUBLIST.EXPENSE
      });
      var tranItemLineCount = newRecord.getLineCount({
        sublistId: _Constants.Constants.UTILS.SUBLIST.ITEM
      });
      var budgetControlRecordFields = void 0;

      var budgetPreferencesObj = useCase._BMUtils.getBudgetPreferences(_Constants.Constants.CUSTOM_SEARCH.FETCH_BUDGET_PREFERENCES);

      var budgetType = budgetPreferencesObj['custrecord_bm_budgetvalidation_source'];
      var _a = _Constants.Constants.TRANSLATIONS.TRANSLATION_COLLECTION,
          COLLECTION_ID = _a.ID,
          ALERT_MSG_YRLY_INVLD_TRAN_DATE = _a.KEYS.ALERT_MSG_YRLY_INVLD_TRAN_DATE;

      if (!period.parent) {
        throw Error(useCase._BMUtils.getTranslationString(COLLECTION_ID, ALERT_MSG_YRLY_INVLD_TRAN_DATE));
      }

      var isBgtCatExistInSubs = subsidiaryPreferences[_Constants.Constants.CUSTOM_RECORD.SUBSIDIARY.STANDARD_BUDGET_CATEGORY];
      var stdBudgetCategory = budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.BUDGET_CATEGORY];
      stdBudgetCategory = !!isBgtCatExistInSubs ? isBgtCatExistInSubs : stdBudgetCategory;

      var budgetPreferencesFieldsObj = _getBudgetPreferenceFields(budgetPreferencesObj);

      budgetControlRecordFields = _getBudgetControlRecordFields(budgetPreferencesObj);

      var globalNameIdMappingDataStore = useCase._BMUtils.createGlobalMappingObject(budgetType);

      if (budgetPreferencesObj[_Constants.Constants.CUSTOM_RECORD.BUDGET_PREFERENCES.FIELDS.PREF_ENABLE_BUDGET] && subsidiaryPreferences[_Constants.Constants.CUSTOM_RECORD.SUBSIDIARY.ENABLE_BUDGET] === 'T') {
        var tranExpenseLinesObj = useCase._BMUtils.getTransactionLines(newRecord, _Constants.Constants.UTILS.SUBLIST.EXPENSE, budgetPreferencesFieldsObj['budgetPreferencesFields']);

        var tranItemLinesObj = useCase._BMUtils.getTransactionLines(newRecord, _Constants.Constants.UTILS.SUBLIST.ITEM, budgetPreferencesFieldsObj['budgetPreferencesFields']);

        var transactionLines = __spreadArrays(tranExpenseLinesObj, tranItemLinesObj);

        var budgetFields = useCase._BMUtils.initializeBudgetAndTranDet();

        var transactionDate = newRecord.getValue(_Constants.Constants.UTILS.FIELDS.TRANDATE).toString();

        if (multiCalendarEnabled) {
          finYearObj = period['parent'] ? useCase._BMQueries.getFinancialYear(period.parent) : '';
        } else {
          var financialYears = useCase._BMQueries.getAccountingPeriodYears();

          if (financialYears && financialYears.length > 0) {
            finYearObj.push(useCase._BMUtils.fetchTranDateFY(financialYears, transactionDate));
          }
        }

        budgetFields['subsidiaryValue'] = newRecord.getValue(_Constants.Constants.UTILS.STANDARD_FIELDS.SUBSIDIARY).toString();
        budgetFields['budgetPeriod'] = period.id;
        budgetFields['transactionLinesObj'] = transactionLines;
        budgetFields['budgetPreferencesFields'] = budgetPreferencesFieldsObj['budgetPreferencesFields'];
        budgetFields['budgetPrefFieldsWithId'] = budgetPreferencesFieldsObj['fieldsAndSegmentsObj'];
        budgetFields['subsidiaryPreferences'] = subsidiaryPreferences;
        budgetFields['budgetPreferences'] = budgetPreferencesObj;
        budgetFields['budgetControlRecordFields'] = budgetControlRecordFields;
        budgetFields['currentRecordId'] = newRecord.id ? newRecord.id.toString() : '';
        budgetFields['contextMode'] = context.type.toString();
        budgetFields['exchangeRate'] = exchangeRate;
        budgetFields['transactionCurrency'] = newRecord.getValue(_Constants.Constants.UTILS.FIELDS.CURRENCY).toString();
        budgetFields['transactionDate'] = transactionDate;
        budgetFields['standardBudgetCat'] = stdBudgetCategory;
        budgetFields['financialYear'] = finYearObj.length ? finYearObj[0].periodname : '';
        budgetFields['financialYearId'] = finYearObj.length ? finYearObj[0].id : '';
        budgetFields['fisCalendar'] = fiscalCalendar;
        var params = {
          recordDetails: budgetFields
        };
        return _validateLinesAndSetData(params, newRecord, lineCount, budgetControlRecordFields, globalNameIdMappingDataStore);
      } else {
        return true;
      }
    } else {
      if (context.type === context.UserEventType.CREATE || context.type === context.UserEventType.EDIT) {
        var _b = _Constants.Constants.UTILS.BUDGET_VALIDATION_CACHE,
            TRANSACTION_LINES_CACHE = _b.TRANSACTION_LINES_CACHE,
            TRANSACTION_LINES_KEY = _b.TRANSACTION_LINES_KEY;
        var transactionLinesCache = cache.getCache({
          name: TRANSACTION_LINES_CACHE,
          scope: cache.Scope.PROTECTED
        });
        var cacheValue = transactionLinesCache.get({
          key: TRANSACTION_LINES_KEY,
          ttl: 300
        });
        transactionLinesCache.remove({
          key: TRANSACTION_LINES_KEY
        });
        var transactionLinesObj = JSON.parse(cacheValue);
        var currRec = context.newRecord; // Set transaction lines if transaction can be saved without errors

        if (transactionLinesObj && transactionLinesObj['tranLineFieldsToBeUpdated'].length > 0 && transactionLinesObj['saveTransaction']) {
          useCase._BMUtils.setTransactionLines(currRec, transactionLinesObj, '');
        }
      }

      return true;
    }
  };

  _exports.beforeSubmit = beforeSubmit;
});