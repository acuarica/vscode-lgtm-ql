
import requestBase = require('request');
import { RequestCallback, Response } from 'request';
const request = requestBase.defaults({ jar: true });

export class LgtmService {

    public nonce: string | null = null;
    public apiVersion: string | null = null;

    public isInitiated() {
        return this.nonce !== null && this.nonce !== ""
            && this.apiVersion !== null && this.apiVersion !== "";
    }

    public init(callback: (lgtm: LgtmService) => void) {
        const extractValue = (body: string, regex: string) => {
            const m = body.match(regex);
            if (m === null) {
                throw Error("Can't extract value");
            }

            const value = m[1];
            return value;
        };

        request("https://lgtm.com/query", (error, response, body) => {
            console.log('init::response:', response);
            console.log('error:', error);
            console.log('statusCode:', response && response.statusCode);

            this.nonce = extractValue(body, "nonce: \"(\\w+)\"");
            console.log('nonce:', this.nonce);
            this.apiVersion = extractValue(body, "<div id=\"preloaded_content\" data-api-version=(\\w+)>");
            console.log('apiVersion:', this.apiVersion);

            callback(this);
        });
    }

    public getDist(callback: RequestCallback) {
        request.get("https://lgtm.com/internal_api/v0.2/getDist", {
            qs: {
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.log('getDist', error, response, body);
            callback(error, response, body);
        });
    }

    public runQuery(lang: string, projectKeys: String, queryString: String, callback: RequestCallback) {
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
            LgtmService.log('runQuery', error, response, body);
            callback(error, response, body);
        });
    }

    public getCustomQueryRunProgress(queryRunKeys: string, callback: RequestCallback) {
        return request.get("https://lgtm.com/internal_api/v0.2/getCustomQueryRunProgress", {
            qs: {
                queryRunKeys: queryRunKeys,
                nonce: this.nonce,
                apiVersion: this.apiVersion
            }
        }, function (error, response, body) {
            LgtmService.log('getCustomQueryRunProgress', error, response, body);
            callback(error, response, body);
        });
    }

    public getCustomQueryRunResults(startIndex: number, count: number, unfiltered: boolean, queryRunKey: string, callback: RequestCallback) {
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
            LgtmService.log('getCustomQueryRunResults', error, response, body);
            callback(error, response, body);
        });
    }

    private static log(source: string, error: any, response: Response, body: any) {
        console.log(source + '::response:', response);
        console.log('error:', error);
        console.log('statusCode:', response && response.statusCode);
    }
}
