
import requestBase = require('request');
import { Response } from 'request';
const request = requestBase.defaults({ jar: true });

type ErrorHandler = (error: any) => void;

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
        }, startIndex: number,
        endIndex: number,
        rows: [any]
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

    public init(errorHandler: ErrorHandler, okHandler: () => void) {
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

                okHandler();
            });
        });
    }

    public getDist(callback: (error: any, body: any) => void) {
        request.get("https://lgtm.com/internal_api/v0.2/getDist", {
            qs: {
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.log('getDist', error, response, body);
            callback(error, body);
        });
    }

    public runQuery(lang: string, projectKeys: String, queryString: String, errorHandler: ErrorHandler, okHandler: (body: RunQueryResponse) => void) {
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
            LgtmService.reply('runQuery', error, response, body, errorHandler, LgtmService.jsonHandler(okHandler));
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

    public getCustomQueryRunResults(startIndex: number, count: number, unfiltered: boolean, queryRunKey: string, errorHandler: ErrorHandler, okHandler: (body: RunResultsResponse) => void) {
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
            LgtmService.reply('getCustomQueryRunResults', error, response, body, errorHandler, LgtmService.jsonHandler(okHandler));
        });
    }

    private static reply(source: string, error: any, response: Response, body: any, errorHandler: ErrorHandler, okHandler: (body: any) => void) {
        LgtmService.log(source, error, response, body);
        if (error !== null) {
            errorHandler(error);
        } else {
            okHandler(body);
        }
    }

    private static jsonHandler<T>(okHandler: (body: T) => void) {
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
