import { Logger } from 'bs-logger';
import type { Diagnostic, ParsedCommandLine } from 'typescript';
import type { RawCompilerOptions } from '../raw-compiler-options';
import type { ProjectConfigTsJest, TsJestAstTransformer, TTypeScript } from '../types';
export declare class ConfigSet {
    readonly parentLogger?: Logger | undefined;
    readonly tsJestDigest: string;
    readonly logger: Logger;
    readonly compilerModule: TTypeScript;
    readonly isolatedModules: boolean;
    readonly cwd: string;
    readonly rootDir: string;
    cacheSuffix: string;
    tsCacheDir: string | undefined;
    parsedTsConfig: ParsedCommandLine | Record<string, any>;
    resolvedTransformers: TsJestAstTransformer;
    useESM: boolean;
    constructor(jestConfig: ProjectConfigTsJest | undefined, parentLogger?: Logger | undefined);
    protected _resolveTsConfig(compilerOptions?: RawCompilerOptions, resolvedConfigFile?: string): Record<string, any>;
    isTestFile(fileName: string): boolean;
    shouldStringifyContent(filePath: string): boolean;
    raiseDiagnostics(diagnostics: Diagnostic[], filePath?: string, logger?: Logger): void;
    shouldReportDiagnostics(filePath: string): boolean;
    resolvePath(inputPath: string, { throwIfMissing, nodeResolve }?: {
        throwIfMissing?: boolean;
        nodeResolve?: boolean;
    }): string;
}
