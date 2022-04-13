"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.factory = void 0;
var bs_logger_1 = require("bs-logger");
var HOIST_METHODS = ['mock', 'unmock', 'enableAutomock', 'disableAutomock', 'deepUnmock'];
var JEST_GLOBALS_MODULE_NAME = '@jest/globals';
var JEST_GLOBAL_NAME = 'jest';
var ROOT_LEVEL_AST = 1;
function factory(_a) {
    var configSet = _a.configSet;
    var logger = configSet.logger.child({ namespace: 'ts-hoisting' });
    var ts = configSet.compilerModule;
    var importNames = [];
    function shouldHoistExpression(node) {
        if (ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            HOIST_METHODS.includes(node.expression.name.text)) {
            if (importNames.length) {
                return ((ts.isIdentifier(node.expression.expression) && importNames.includes(node.expression.expression.text)) ||
                    (ts.isPropertyAccessExpression(node.expression.expression) &&
                        ts.isIdentifier(node.expression.expression.expression) &&
                        importNames.includes(node.expression.expression.expression.text)) ||
                    shouldHoistExpression(node.expression.expression));
            }
            else {
                return ((ts.isIdentifier(node.expression.expression) && node.expression.expression.text === JEST_GLOBAL_NAME) ||
                    shouldHoistExpression(node.expression.expression));
            }
        }
        return false;
    }
    function shouldHoistNode(node) {
        return ts.isExpressionStatement(node) && shouldHoistExpression(node.expression);
    }
    function isJestGlobalImport(node) {
        return (ts.isImportDeclaration(node) &&
            ts.isStringLiteral(node.moduleSpecifier) &&
            node.moduleSpecifier.text === JEST_GLOBALS_MODULE_NAME);
    }
    function createVisitor(ctx, _) {
        var level = 0;
        var hoisted = [];
        var enter = function () {
            level++;
            if (hoisted[level]) {
                hoisted[level].splice(0, hoisted[level].length);
            }
        };
        var exit = function () { return level--; };
        var hoist = function (node) {
            if (hoisted[level]) {
                hoisted[level].push(node);
            }
            else {
                hoisted[level] = [node];
            }
        };
        var visitor = function (node) {
            var _a, _b;
            enter();
            var resultNode = ts.visitEachChild(node, visitor, ctx);
            if (isJestGlobalImport(resultNode) &&
                ((_a = resultNode.importClause) === null || _a === void 0 ? void 0 : _a.namedBindings) &&
                (ts.isNamespaceImport(resultNode.importClause.namedBindings) ||
                    ts.isNamedImports(resultNode.importClause.namedBindings))) {
                var namedBindings = resultNode.importClause.namedBindings;
                var jestImportName = ts.isNamespaceImport(namedBindings)
                    ? namedBindings.name.text
                    : (_b = namedBindings.elements.find(function (element) { var _a; return element.name.text === JEST_GLOBAL_NAME || ((_a = element.propertyName) === null || _a === void 0 ? void 0 : _a.text) === JEST_GLOBAL_NAME; })) === null || _b === void 0 ? void 0 : _b.name.text;
                if (jestImportName) {
                    importNames.push(jestImportName);
                }
            }
            if (hoisted[level] && hoisted[level].length) {
                var hoistedStmts_1 = hoisted[level];
                var otherStmts = resultNode.statements.filter(function (s) { return !hoistedStmts_1.includes(s) && !isJestGlobalImport(s); });
                var newNode = ts.getMutableClone(resultNode);
                var newStatements = __spreadArray(__spreadArray([], __read(hoistedStmts_1)), __read(otherStmts));
                if (level === ROOT_LEVEL_AST) {
                    var jestGlobalsImportStmts = resultNode.statements.filter(function (s) { return isJestGlobalImport(s); });
                    resultNode = __assign(__assign({}, newNode), { statements: ts.createNodeArray(__spreadArray(__spreadArray([], __read(jestGlobalsImportStmts)), __read(newStatements))) });
                }
                else {
                    resultNode = __assign(__assign({}, newNode), { statements: ts.createNodeArray(newStatements) });
                }
            }
            exit();
            if (shouldHoistNode(resultNode)) {
                hoist(resultNode);
            }
            return resultNode;
        };
        return visitor;
    }
    return function (ctx) {
        var _a;
        return logger.wrap((_a = {}, _a[bs_logger_1.LogContexts.logLevel] = bs_logger_1.LogLevels.debug, _a.call = null, _a), 'visitSourceFileNode(): hoisting', function (sf) { return ts.visitNode(sf, createVisitor(ctx, sf)); });
    };
}
exports.factory = factory;
