
import requestBase = require('request');
import { Response } from 'request';
const request = requestBase.defaults({ jar: true });

type ErrorHandler = (error: any) => void;

export interface Project {
    key: string;
    languages: [string];
    totalLanguageChurn: [{ lang: string, churn: number }];
    displayName: string;
    slug: string;
    externalURL: {
        url: string;
        name: string;
        theme: string;
    };
    adminURL: string;
    modes: { [lang: string]: string };
}

interface GetProjectsByKeySuccess {
    status: "success";
    data: {
        fullProjects: {
            [key: string]: Project
        }
        anonProject: {}
    };
}

type GetProjectsByKeyResponse = GetProjectsByKeySuccess;

interface GetDistSuccess {
    status: "success";
    data: string;
}

type GetDistResponse = GetDistSuccess;

interface CheckErrorsSuccess {
    data: {
        errors: [{
            severity: string,
            position: {
                file: string,
                line: number,
                column: number,
                endLine: number,
                endColumn: number
            }, message: string,
            libraryError: boolean
        }],
        guessedLocation: string
    };
}

type CheckErrorsResponse = CheckErrorsSuccess;

interface AutoCompleteRequest {
    distribution: string;
    language: string;
    offset: number;
    queryPath: string;
    queryText: string;
}

interface AutoCompleteResponse {
    data: any;
}

interface ToolTipResponse {
    data: {
        tooltip: string;
        jumpable: boolean;
    };
}

export function toolTip(req: AutoCompleteRequest, errorHandler: ErrorHandler, okHandler: (body: ToolTipResponse) => void) {
    request.post("https://lgtm.com/qlapi-fast/tooltip", {
        json: req
    }, (error, response, body) => {
        LgtmService.reply(
            'tooltip',
            error,
            response,
            body,
            errorHandler,
            okHandler
        );
    });
}

export function autoComplete(req: AutoCompleteRequest, errorHandler: ErrorHandler, okHandler: (body: AutoCompleteResponse) => void) {
    request.post("https://lgtm.com/qlapi-fast/autocomplete", {
        json: req
    }, (error, response, body) => {
        LgtmService.reply(
            'autoComplete',
            error,
            response,
            body,
            errorHandler,
            LgtmService.jsonHandler(okHandler)
        );
    });
}

interface RunQuerySuccess {
    status: "success";
    data: {
        key: string,
        queyText: string,
        runs: [{
            key: string,
            projectKey: string,
            lang: string,
            snapshotKey: string,
            srcRevision: string,
            done: boolean
        }]
    };
}

interface RunQueryError {
    status: "error";
    error: string;
    message: string;
}

export type RunQueryResponse = RunQuerySuccess | RunQueryError;

export interface QueryRunProgressKeys {
    [key: string]: {
        done: boolean,
        progress: number,
        error?: string
    };
}

interface QueryRunProgressSuccess {
    status: string;
    data: QueryRunProgressKeys;
}

export type QueryRunProgressResponse = QueryRunProgressSuccess;

interface RunResultsSuccess {
    status: string;
    data: {
        metadata: {
            numResults: number,
            numExcludedResults: number,
            resultsWereTruncated: boolean,
            columns: [string],
            isInAlertFormat: boolean
        },
        startIndex: number,
        endIndex: number,
        rows: [[
            {
                label: string,
                fileLocation?: { path: string, line: number }
            }
        ]]
    };
}

type RunResultsResponse = RunResultsSuccess;

export class LgtmService {

    public nonce: string | null = null;
    public apiVersion: string | null = null;

    public isInitiated() {
        return this.nonce !== null && this.nonce !== ""
            && this.apiVersion !== null && this.apiVersion !== "";
    }

    public init(errorHandler: ErrorHandler, okHandler: (nonce: string, apiVersion: string) => void) {
        request("https://lgtm.com/query", (error, response, body) => {
            const extractValue = (body: string, regex: string) => {
                const m = body.match(regex);
                if (m === null) {
                    throw Error("Can't extract value");
                }

                const value = m[1];
                return value;
            };

            LgtmService.reply('init', error, response, body, errorHandler, () => {
                this.nonce = extractValue(body, "nonce: \"(\\w+)\"");
                console.log('nonce:', this.nonce);
                this.apiVersion = extractValue(body, "<div id=\"preloaded_content\" data-api-version=(\\w+)>");
                console.log('apiVersion:', this.apiVersion);

                okHandler(this.nonce, this.apiVersion);
            });
        });
    }

    public getDist(
        errorHandler: ErrorHandler,
        okHandler: (body: GetDistResponse) => void
    ) {
        request.get("https://lgtm.com/internal_api/v0.2/getDist", {
            qs: {
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.reply(
                'getDist',
                error,
                response,
                body,
                errorHandler,
                LgtmService.jsonHandler(okHandler)
            );
        });
    }

    public getProjectsByKey(
        keys: string,
        errorHandler: ErrorHandler,
        okHandler: (body: GetProjectsByKeyResponse) => void
    ) {
        request.get("https://lgtm.com/internal_api/v0.2/getProjectsByKey", {
            qs: {
                keys: keys,
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.reply(
                'getProjectsByKey',
                error,
                response,
                body,
                errorHandler,
                LgtmService.jsonHandler(okHandler)
            );
        });
    }

    public checkErrors(
        distribution: string,
        language: string,
        queryText: string,
        errorHandler: ErrorHandler,
        okHandler: (body: CheckErrorsResponse) => void
    ) {
        request.post("https://lgtm.com/qlapi-slow/checkerrors", {
            json: {
                distribution: distribution,
                language: language,
                queryText: queryText
            }
        }, (error, response, body) => {
            LgtmService.reply(
                'checkErrors',
                error,
                response,
                body,
                errorHandler,
                // LgtmService.jsonHandler(okHandler)
                okHandler
            );
        });
    }

    public runQuery(
        lang: string,
        projectKeys: string,
        queryString: string,
        errorHandler: ErrorHandler,
        okHandler: (body: RunQueryResponse) => void
    ) {
        request.post("https://lgtm.com/internal_api/v0.2/runQuery", {
            form: {
                lang: "java",
                projectKeys: projectKeys,
                queryString: queryString,
                guessedLocation: "",
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, (error, response, body) => {
            LgtmService.reply(
                'runQuery',
                error,
                response,
                body,
                errorHandler,
                LgtmService.jsonHandler(okHandler)
            );
        });
    }

    public getCustomQueryRunProgress(queryRunKeys: string, errorHandler: ErrorHandler, okHandler: (body: QueryRunProgressResponse) => void) {
        return request.get("https://lgtm.com/internal_api/v0.2/getCustomQueryRunProgress", {
            qs: {
                queryRunKeys: queryRunKeys,
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.reply('getCustomQueryRunProgress', error, response, body, errorHandler, LgtmService.jsonHandler(okHandler));
        });
    }

    public getCustomQueryRunResults(
        startIndex: number,
        count: number,
        unfiltered: boolean,
        queryRunKey: string,
        errorHandler: ErrorHandler,
        okHandler: (body: RunResultsResponse) => void
    ) {
        request.get("https://lgtm.com/internal_api/v0.2/getCustomQueryRunResults", {
            qs: {
                startIndex: startIndex,
                count: count,
                unfiltered: unfiltered ? 'true' : 'false',
                queryRunKey: queryRunKey,
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.reply(
                'getCustomQueryRunResults',
                error,
                response,
                body,
                errorHandler,
                LgtmService.jsonHandler(okHandler)
            );
        });
    }

    static reply(
        source: string,
        error: any,
        response: Response,
        body: any,
        errorHandler: ErrorHandler,
        okHandler: (body: any) => void
    ) {
        LgtmService.log(source, error, response, body);
        if (error !== null) {
            errorHandler(error);
        } else {
            okHandler(body);
        }
    }

    static jsonHandler<T>(okHandler: (body: T) => void): ((a: any) => void) {
        return function (body: any) {
            okHandler(JSON.parse(body));
        };
    }

    private static log(source: string, error: any, response: Response, body: any) {
        console.log(`@LgtmService::${source} response:`, response);
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
    }
}
