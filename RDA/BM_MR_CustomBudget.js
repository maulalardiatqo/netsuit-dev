/**
 * Copyright (c) 2018 Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

define(["exports", "N/log", "N/record", "N/search", "N/query", "N/runtime", "N/email", "N/format", "N/translation", "../gateway/CustomBudgetGateway", "../useCase/CustomBudgetUseCase", "../../common/constants/Constants"], function (_exports, log, record, search, query, runtime, email, format, translation, _CustomBudgetGateway, _CustomBudgetUseCase, _Constants) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.summarize = _exports.map = _exports.getInputData = void 0;
  log = _interopRequireWildcard(log);
  record = _interopRequireWildcard(record);
  search = _interopRequireWildcard(search);
  query = _interopRequireWildcard(query);
  runtime = _interopRequireWildcard(runtime);
  email = _interopRequireWildcard(email);
  format = _interopRequireWildcard(format);
  translation = _interopRequireWildcard(translation);
  _CustomBudgetGateway = _interopRequireDefault(_CustomBudgetGateway);
  _CustomBudgetUseCase = _interopRequireDefault(_CustomBudgetUseCase);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

  function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

  function _createGateway() {
    return new _CustomBudgetGateway["default"]({
      dependencies: {
        'N/search': search,
        'N/record': record,
        'N/query': query,
        'N/runtime': runtime,
        'N/email': email,
        'N/format': format,
        'N/translation': translation
      },
      constants: _Constants.Constants
    });
  }

  function _createUseCase() {
    return new _CustomBudgetUseCase["default"]({
      dependencies: {
        CustomBudgetGateway: _createGateway()
      }
    });
  }

  var getInputData = function getInputData() {
    try {
      var useCase = _createUseCase();

      var result = [];
      result = useCase.getCustomBudgetsList();
      var periodsList = useCase.getPeriodNamesList();
      var budgetRangePref = useCase.getBudgetMethodDDValues();
      var subsidiaryFiscalCal = useCase.getSubsidiaryFiscalCal();
      var isMultiCalendarEnabled = useCase.isMultiCalendarEnabled();
      var accountingPeriods = useCase.getAccountingPeriodObj();
      var fiscalCalNames = [];

      if (isMultiCalendarEnabled) {
        fiscalCalNames = useCase.getFiscalCalNames();
      }

      for (var i = 0; i < result.length; i++) {
        result[i].periodsList = JSON.parse(JSON.stringify(periodsList));
        result[i].budgetRangePref = JSON.parse(JSON.stringify(budgetRangePref));
        result[i].subsidiaryFiscalCal = subsidiaryFiscalCal;
        result[i].fiscalCalNames = fiscalCalNames;
        result[i].isMultiCalendarEnabled = isMultiCalendarEnabled;
        result[i].accountingPeriods = accountingPeriods;
      }

      return result;
    } catch (ex) {
      throw Error(ex.message);
    }
  };

  _exports.getInputData = getInputData;

  var map = function map(context) {
    var result = JSON.parse(context.value);

    try {
      var useCase = _createUseCase();

      var resObj = useCase.updateCustomTransaction(result);
      context.write(resObj.key, resObj.value);
    } catch (ex) {
      throw Error(result.id + " | " + ex.message);
    }
  };

  _exports.map = map;

  var summarize = function summarize(summary) {
    var totTransactionsUpdated = 0;
    var isMapError = false;

    if (summary.inputSummary.error) {
      log.error('Input Error', summary.inputSummary.error);
    } else {
      summary.mapSummary.errors.iterator().each(function (key, e) {
        isMapError = true;
        var error = JSON.parse(e);
        var errorString = error.message ? error.message : error;
        log.error("Map Error", errorString);
        return true;
      });
    }

    if (isMapError || summary.inputSummary.error) {
      var useCase = _createUseCase();

      useCase.sendEmail();
    }

    summary.output.iterator().each(function (key, value) {
      totTransactionsUpdated++;
      return true;
    });
    log.audit({
      title: 'Total Records Updated',
      details: totTransactionsUpdated
    });
  };

  _exports.summarize = summarize;
});