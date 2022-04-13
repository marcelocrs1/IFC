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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigSet = exports.TS_JEST_OUT_DIR = exports.IGNORE_DIAGNOSTIC_CODES = exports.MY_DIGEST = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var bs_logger_1 = require("bs-logger");
var jest_util_1 = require("jest-util");
var json5_1 = __importDefault(require("json5"));
var constants_1 = require("../constants");
var backports_1 = require("../utils/backports");
var importer_1 = require("../utils/importer");
var json_1 = require("../utils/json");
var logger_1 = require("../utils/logger");
var messages_1 = require("../utils/messages");
var normalize_slashes_1 = require("../utils/normalize-slashes");
var sha1_1 = require("../utils/sha1");
var ts_error_1 = require("../utils/ts-error");
exports.MY_DIGEST = fs_1.readFileSync(path_1.resolve(__dirname, '..', '..', '.ts-jest-digest'), 'utf8');
exports.IGNORE_DIAGNOSTIC_CODES = [
    6059,
    18002,
    18003,
];
exports.TS_JEST_OUT_DIR = '$$ts-jest$$';
var normalizeRegex = function (pattern) {
    return pattern ? (typeof pattern === 'string' ? pattern : pattern.source) : undefined;
};
var toDiagnosticCode = function (code) { var _a; return code ? (_a = parseInt(("" + code).trim().replace(/^TS/, ''), 10)) !== null && _a !== void 0 ? _a : undefined : undefined; };
var toDiagnosticCodeList = function (items, into) {
    var e_1, _a;
    if (into === void 0) { into = []; }
    try {
        for (var items_1 = __values(items), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
            var item = items_1_1.value;
            if (typeof item === 'string') {
                var children = item.trim().split(/\s*,\s*/g);
                if (children.length > 1) {
                    toDiagnosticCodeList(children, into);
                    continue;
                }
                item = children[0];
            }
            if (!item)
                continue;
            var code = toDiagnosticCode(item);
            if (code && !into.includes(code))
                into.push(code);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (items_1_1 && !items_1_1.done && (_a = items_1.return)) _a.call(items_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return into;
};
var ConfigSet = (function () {
    function ConfigSet(jestConfig, parentLogger) {
        var _a, _b;
        var _c, _d, _e, _f;
        this.parentLogger = parentLogger;
        this.tsJestDigest = exports.MY_DIGEST;
        this.resolvedTransformers = {
            before: [],
            after: [],
            afterDeclarations: [],
        };
        this.useESM = false;
        this._overriddenCompilerOptions = {
            inlineSourceMap: false,
            declaration: false,
            noEmit: false,
            removeComments: false,
            out: undefined,
            outFile: undefined,
            composite: undefined,
            declarationDir: undefined,
            declarationMap: undefined,
            emitDeclarationOnly: undefined,
            sourceRoot: undefined,
            tsBuildInfoFile: undefined,
        };
        this.logger = this.parentLogger
            ? this.parentLogger.child((_a = {}, _a[bs_logger_1.LogContexts.namespace] = 'config', _a))
            : logger_1.rootLogger.child({ namespace: 'config' });
        this._backportJestCfg(jestConfig !== null && jestConfig !== void 0 ? jestConfig : Object.create(null));
        this.cwd = path_1.normalize((_c = this._jestCfg.cwd) !== null && _c !== void 0 ? _c : process.cwd());
        this.rootDir = path_1.normalize((_d = this._jestCfg.rootDir) !== null && _d !== void 0 ? _d : this.cwd);
        var tsJestCfg = this._jestCfg.globals && this._jestCfg.globals['ts-jest'];
        var options = tsJestCfg !== null && tsJestCfg !== void 0 ? tsJestCfg : Object.create(null);
        this.compilerModule = importer_1.importer.typescript("Using \"ts-jest\" requires this package to be installed.", (_e = options.compiler) !== null && _e !== void 0 ? _e : 'typescript');
        this.isolatedModules = (_f = options.isolatedModules) !== null && _f !== void 0 ? _f : false;
        this.logger.debug({ compilerModule: this.compilerModule }, 'normalized compiler module config via ts-jest option');
        this._setupConfigSet(options);
        this._resolveTsCacheDir();
        this._matchablePatterns = __spreadArray(__spreadArray([], __read(this._jestCfg.testMatch)), __read(this._jestCfg.testRegex)).filter(function (pattern) {
            return pattern instanceof RegExp || typeof pattern === 'string';
        });
        if (!this._matchablePatterns.length) {
            (_b = this._matchablePatterns).push.apply(_b, __spreadArray([], __read(constants_1.DEFAULT_JEST_TEST_MATCH)));
        }
        this._matchTestFilePath = jest_util_1.globsToMatcher(this._matchablePatterns.filter(function (pattern) { return typeof pattern === 'string'; }));
    }
    ConfigSet.prototype._backportJestCfg = function (jestCfg) {
        var _a, _b;
        var config = backports_1.backportJestConfig(this.logger, jestCfg);
        this.logger.debug({ jestConfig: config }, 'normalized jest config');
        this._jestCfg = __assign(__assign({}, config), { testMatch: (_a = config.testMatch) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_JEST_TEST_MATCH, testRegex: (_b = config.testRegex) !== null && _b !== void 0 ? _b : [] });
    };
    ConfigSet.prototype._setupConfigSet = function (options) {
        var _this = this;
        var _a, _b, _c, _d, _e;
        this.useESM = (_a = options.useESM) !== null && _a !== void 0 ? _a : false;
        if (!options.babelConfig) {
            this.logger.debug('babel is disabled');
        }
        else {
            var baseBabelCfg = { cwd: this.cwd };
            if (typeof options.babelConfig === 'string') {
                var babelCfgPath = this.resolvePath(options.babelConfig);
                if (path_1.extname(options.babelConfig) === '.js') {
                    this.babelConfig = __assign(__assign({}, baseBabelCfg), require(babelCfgPath));
                }
                else {
                    this.babelConfig = __assign(__assign({}, baseBabelCfg), json5_1.default.parse(fs_1.readFileSync(babelCfgPath, 'utf-8')));
                }
            }
            else if (typeof options.babelConfig === 'object') {
                this.babelConfig = __assign(__assign({}, baseBabelCfg), options.babelConfig);
            }
            else {
                this.babelConfig = baseBabelCfg;
            }
            this.logger.debug({ babelConfig: this.babelConfig }, 'normalized babel config via ts-jest option');
            this.babelJestTransformer = importer_1.importer
                .babelJest("Using \"babel-jest\" requires this package to be installed.")
                .default.createTransformer(this.babelConfig);
            this.logger.debug('created babel-jest transformer');
        }
        var diagnosticsOpt = (_b = options.diagnostics) !== null && _b !== void 0 ? _b : true;
        var ignoreList = __spreadArray([], __read(exports.IGNORE_DIAGNOSTIC_CODES));
        if (typeof diagnosticsOpt === 'object') {
            var ignoreCodes = diagnosticsOpt.ignoreCodes;
            if (ignoreCodes) {
                Array.isArray(ignoreCodes) ? ignoreList.push.apply(ignoreList, __spreadArray([], __read(ignoreCodes))) : ignoreList.push(ignoreCodes);
            }
            this._diagnostics = {
                pretty: (_c = diagnosticsOpt.pretty) !== null && _c !== void 0 ? _c : true,
                exclude: (_d = diagnosticsOpt.exclude) !== null && _d !== void 0 ? _d : [],
                ignoreCodes: toDiagnosticCodeList(ignoreList),
                throws: !diagnosticsOpt.warnOnly,
            };
        }
        else {
            this._diagnostics = {
                ignoreCodes: diagnosticsOpt ? toDiagnosticCodeList(ignoreList) : [],
                exclude: [],
                pretty: true,
                throws: diagnosticsOpt,
            };
        }
        this._shouldIgnoreDiagnosticsForFile = this._diagnostics.exclude.length
            ? jest_util_1.globsToMatcher(this._diagnostics.exclude)
            : function () { return false; };
        this.logger.debug({ diagnostics: this._diagnostics }, 'normalized diagnostics config via ts-jest option');
        var tsconfigOpt = options.tsconfig;
        var configFilePath = typeof tsconfigOpt === 'string' ? this.resolvePath(tsconfigOpt) : undefined;
        this.parsedTsConfig = this._getAndResolveTsConfig(typeof tsconfigOpt === 'object' ? tsconfigOpt : undefined, configFilePath);
        this.raiseDiagnostics(this.parsedTsConfig.errors, configFilePath);
        this.logger.debug({ tsconfig: this.parsedTsConfig }, 'normalized typescript config via ts-jest option');
        this.resolvedTransformers.before = [require('../transformers/hoist-jest')];
        var astTransformers = options.astTransformers;
        if (astTransformers) {
            var resolveTransformers = function (transformers) {
                return transformers.map(function (transformer) {
                    if (typeof transformer === 'string') {
                        return require(_this.resolvePath(transformer, { nodeResolve: true }));
                    }
                    else {
                        return __assign(__assign({}, require(_this.resolvePath(transformer.path, { nodeResolve: true }))), { options: transformer.options });
                    }
                });
            };
            if (astTransformers.before) {
                (_e = this.resolvedTransformers.before) === null || _e === void 0 ? void 0 : _e.push.apply(_e, __spreadArray([], __read(resolveTransformers(astTransformers.before))));
            }
            if (astTransformers.after) {
                this.resolvedTransformers = __assign(__assign({}, this.resolvedTransformers), { after: resolveTransformers(astTransformers.after) });
            }
            if (astTransformers.afterDeclarations) {
                this.resolvedTransformers = __assign(__assign({}, this.resolvedTransformers), { afterDeclarations: resolveTransformers(astTransformers.afterDeclarations) });
            }
        }
        this.logger.debug({ customTransformers: this.resolvedTransformers }, 'normalized custom AST transformers via ts-jest option');
        if (options.stringifyContentPathRegex) {
            this._stringifyContentRegExp =
                typeof options.stringifyContentPathRegex === 'string'
                    ? new RegExp(normalizeRegex(options.stringifyContentPathRegex))
                    : options.stringifyContentPathRegex;
            this.logger.debug({ stringifyContentPathRegex: this._stringifyContentRegExp }, 'normalized stringifyContentPathRegex config via ts-jest option');
        }
    };
    ConfigSet.prototype._resolveTsCacheDir = function () {
        this.cacheSuffix = sha1_1.sha1(json_1.stringify({
            version: this.compilerModule.version,
            digest: this.tsJestDigest,
            babelConfig: this.babelConfig,
            compilerModule: this.compilerModule,
            tsconfig: {
                options: this.parsedTsConfig.options,
                raw: this.parsedTsConfig.raw,
            },
            isolatedModules: this.isolatedModules,
            diagnostics: this._diagnostics,
            transformers: this.resolvedTransformers,
        }));
        if (!this._jestCfg.cache) {
            this.logger.debug('file caching disabled');
        }
        else {
            var res = path_1.join(this._jestCfg.cacheDirectory, 'ts-jest', this.cacheSuffix.substr(0, 2), this.cacheSuffix.substr(2));
            this.logger.debug({ cacheDirectory: res }, 'will use file caching');
            this.tsCacheDir = res;
        }
    };
    ConfigSet.prototype._getAndResolveTsConfig = function (compilerOptions, resolvedConfigFile) {
        var e_2, _a, _b;
        var _c, _d, _e;
        var result = this._resolveTsConfig(compilerOptions, resolvedConfigFile);
        var forcedOptions = this._overriddenCompilerOptions;
        var finalOptions = result.options;
        if (finalOptions.target === undefined) {
            finalOptions.target = this.compilerModule.ScriptTarget.ES2015;
        }
        var target = finalOptions.target;
        var defaultModule = [this.compilerModule.ScriptTarget.ES3, this.compilerModule.ScriptTarget.ES5].includes(target)
            ? this.compilerModule.ModuleKind.CommonJS
            : this.compilerModule.ModuleKind.ESNext;
        var moduleValue = (_c = finalOptions.module) !== null && _c !== void 0 ? _c : defaultModule;
        if (!this.babelConfig &&
            moduleValue !== this.compilerModule.ModuleKind.CommonJS &&
            !(finalOptions.esModuleInterop || finalOptions.allowSyntheticDefaultImports)) {
            result.errors.push({
                code: 151001,
                messageText: "If you have issues related to imports, you should consider setting `esModuleInterop` to `true` in your TypeScript configuration file (usually `tsconfig.json`). See https://blogs.msdn.microsoft.com/typescript/2018/01/31/announcing-typescript-2-7/#easier-ecmascript-module-interoperability for more information.",
                category: this.compilerModule.DiagnosticCategory.Message,
                file: undefined,
                start: undefined,
                length: undefined,
            });
            if (!('allowSyntheticDefaultImports' in finalOptions)) {
                finalOptions.allowSyntheticDefaultImports = true;
            }
        }
        if (finalOptions.allowJs && !finalOptions.outDir) {
            finalOptions.outDir = exports.TS_JEST_OUT_DIR;
        }
        try {
            for (var _f = __values(Object.keys(forcedOptions)), _g = _f.next(); !_g.done; _g = _f.next()) {
                var key = _g.value;
                var val = forcedOptions[key];
                if (val === undefined) {
                    delete finalOptions[key];
                }
                else {
                    finalOptions[key] = val;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_g && !_g.done && (_a = _f.return)) _a.call(_f);
            }
            finally { if (e_2) throw e_2.error; }
        }
        var nodeJsVer = process.version;
        var compilationTarget = result.options.target;
        var TARGET_TO_VERSION_MAPPING = (_b = {},
            _b[this.compilerModule.ScriptTarget.ES2018] = 'es2018',
            _b[this.compilerModule.ScriptTarget.ES2019] = 'es2019',
            _b[this.compilerModule.ScriptTarget.ES2020] = 'es2020',
            _b[this.compilerModule.ScriptTarget.ESNext] = 'ESNext',
            _b);
        if (compilationTarget &&
            !this.babelConfig &&
            ((nodeJsVer.startsWith('v10') && compilationTarget > this.compilerModule.ScriptTarget.ES2018) ||
                (nodeJsVer.startsWith('v12') && compilationTarget > this.compilerModule.ScriptTarget.ES2019))) {
            var message = messages_1.interpolate("There is a mismatch between your NodeJs version {{nodeJsVer}} and your TypeScript target {{compilationTarget}}. This might lead to some unexpected errors when running tests with `ts-jest`. To fix this, you can check https://github.com/microsoft/TypeScript/wiki/Node-Target-Mapping", {
                nodeJsVer: process.version,
                compilationTarget: TARGET_TO_VERSION_MAPPING[compilationTarget],
            });
            this.logger.warn(message);
        }
        var resultOptions = result.options;
        var sourceMap = (_d = resultOptions.sourceMap) !== null && _d !== void 0 ? _d : true;
        return __assign(__assign({}, result), { options: __assign(__assign({}, resultOptions), { sourceMap: sourceMap, inlineSources: sourceMap, module: (_e = resultOptions.module) !== null && _e !== void 0 ? _e : this.compilerModule.ModuleKind.CommonJS }) });
    };
    ConfigSet.prototype._resolveTsConfig = function (compilerOptions, resolvedConfigFile) {
        var config = { compilerOptions: Object.create(null) };
        var basePath = normalize_slashes_1.normalizeSlashes(this.rootDir);
        var ts = this.compilerModule;
        var configFileName = resolvedConfigFile
            ? normalize_slashes_1.normalizeSlashes(resolvedConfigFile)
            : ts.findConfigFile(normalize_slashes_1.normalizeSlashes(this.rootDir), ts.sys.fileExists);
        if (configFileName) {
            this.logger.debug({ tsConfigFileName: configFileName }, 'readTsConfig(): reading', configFileName);
            var result = ts.readConfigFile(configFileName, ts.sys.readFile);
            if (result.error) {
                return { errors: [result.error], fileNames: [], options: {} };
            }
            config = result.config;
            basePath = normalize_slashes_1.normalizeSlashes(path_1.dirname(configFileName));
        }
        config.compilerOptions = __assign(__assign({}, config.compilerOptions), compilerOptions);
        return ts.parseJsonConfigFileContent(config, ts.sys, basePath, undefined, configFileName);
    };
    ConfigSet.prototype.isTestFile = function (fileName) {
        var _this = this;
        return this._matchablePatterns.some(function (pattern) {
            return typeof pattern === 'string' ? _this._matchTestFilePath(fileName) : pattern.test(fileName);
        });
    };
    ConfigSet.prototype.shouldStringifyContent = function (filePath) {
        return this._stringifyContentRegExp ? this._stringifyContentRegExp.test(filePath) : false;
    };
    ConfigSet.prototype.raiseDiagnostics = function (diagnostics, filePath, logger) {
        var _this = this;
        var ignoreCodes = this._diagnostics.ignoreCodes;
        var DiagnosticCategory = this.compilerModule.DiagnosticCategory;
        var filteredDiagnostics = filePath && !this.shouldReportDiagnostics(filePath)
            ? []
            : diagnostics.filter(function (diagnostic) {
                var _a;
                if (((_a = diagnostic.file) === null || _a === void 0 ? void 0 : _a.fileName) && !_this.shouldReportDiagnostics(diagnostic.file.fileName)) {
                    return false;
                }
                return !ignoreCodes.includes(diagnostic.code);
            });
        if (!filteredDiagnostics.length)
            return;
        var error = this._createTsError(filteredDiagnostics);
        var importantCategories = [DiagnosticCategory.Warning, DiagnosticCategory.Error];
        if (this._diagnostics.throws && filteredDiagnostics.some(function (d) { return importantCategories.includes(d.category); })) {
            throw error;
        }
        logger ? logger.warn({ error: error }, error.message) : this.logger.warn({ error: error }, error.message);
    };
    ConfigSet.prototype.shouldReportDiagnostics = function (filePath) {
        var fileExtension = path_1.extname(filePath);
        return constants_1.JS_JSX_EXTENSIONS.includes(fileExtension)
            ? this.parsedTsConfig.options.checkJs && !this._shouldIgnoreDiagnosticsForFile(filePath)
            : !this._shouldIgnoreDiagnosticsForFile(filePath);
    };
    ConfigSet.prototype._createTsError = function (diagnostics) {
        var _this = this;
        var formatDiagnostics = this._diagnostics.pretty
            ? this.compilerModule.formatDiagnosticsWithColorAndContext
            : this.compilerModule.formatDiagnostics;
        var diagnosticHost = {
            getNewLine: function () { return '\n'; },
            getCurrentDirectory: function () { return _this.cwd; },
            getCanonicalFileName: function (path) { return path; },
        };
        var diagnosticText = formatDiagnostics(diagnostics, diagnosticHost);
        var diagnosticCodes = diagnostics.map(function (x) { return x.code; });
        return new ts_error_1.TSError(diagnosticText, diagnosticCodes);
    };
    ConfigSet.prototype.resolvePath = function (inputPath, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.throwIfMissing, throwIfMissing = _c === void 0 ? true : _c, _d = _b.nodeResolve, nodeResolve = _d === void 0 ? false : _d;
        var path = inputPath;
        var nodeResolved = false;
        if (path.startsWith('<rootDir>')) {
            path = path_1.resolve(path_1.join(this.rootDir, path.substr(9)));
        }
        else if (!path_1.isAbsolute(path)) {
            if (!path.startsWith('.') && nodeResolve) {
                try {
                    path = require.resolve(path);
                    nodeResolved = true;
                }
                catch (_) { }
            }
            if (!nodeResolved) {
                path = path_1.resolve(this.cwd, path);
            }
        }
        if (!nodeResolved && nodeResolve) {
            try {
                path = require.resolve(path);
                nodeResolved = true;
            }
            catch (_) { }
        }
        if (throwIfMissing && !fs_1.existsSync(path)) {
            throw new Error(messages_1.interpolate("File not found: {{inputPath}} (resolved as: {{resolvedPath}})", { inputPath: inputPath, resolvedPath: path }));
        }
        this.logger.debug({ fromPath: inputPath, toPath: path }, 'resolved path from', inputPath, 'to', path);
        return path;
    };
    return ConfigSet;
}());
exports.ConfigSet = ConfigSet;