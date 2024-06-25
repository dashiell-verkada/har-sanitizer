/* eslint-disable @typescript-eslint/no-explicit-any */
export type PossibleScrubItems = {
	headers: string[];
	cookies: string[];
	queryArgs: string[];
	postParams: string[];
	mimeTypes: string[];
};

export type URLSchema = {
    name: string;
	exp: RegExp;
	redactRequest: boolean;
	redactResponse: boolean;
};

export type SanitizeOptions = {
	scrubWords?: string[];
	scrubMimetypes?: string[];
	allCookies?: boolean;
	allHeaders?: boolean;
	allQueryArgs?: boolean;
	allMimeTypes?: boolean;
	allPostParams?: boolean;
};

export const defaultURLSchemas : URLSchema[]= [
	{
        name: "v-media",
		exp: /https:\/\/vmedia\.command\.verkada\.com\/library\/enckey/,
		redactRequest: false,
		redactResponse: true,
	},
	{
		name: "datadog",
		exp: /https:\/\/vlogging\.[(global\-prod)|(prod1)|(prod2)]\.command\.verkada\.com\/datadog_events/,
		redactRequest: true,
		redactResponse: false,
	},
	{
		name: "intercom",
		exp: /https:\/\/api-iam\.intercom\.io\/messenger\/web\/ping/,
		redactRequest: false,
		redactResponse: true,
	}

];

export const defaultImageAndVideoInfo : string[] = [
    "application/x-mpegurl",
    "application/octet-stream",
	"image/jpeg",
	"image/webp",
];

export const defaultMimeTypesList : string[] = [
	"application/javascript", 
	"text/javascript",
	"text/css",
];

export const mimeCheckList = [
	"application/json",
	"text/plain;charset=UTF-8",
];

export const replacementList = [
   "lanServerAuth",
   "auth",
   "credential",
   "url",
   "password",
   "id",
];

export const defaultWordList : string[] = [
	"Authorization",
	"SAMLRequest",
	"SAMLResponse",
	"access_token",
	"appID",
	"assertion",
	"auth",
	"authenticity_token",
	"challenge",
	"client_id",
	"client_secret",
	"code",
	"code_challenge",
	"code_verifier",
	"email",
	"facetID",
	"fcParams",
	"id_token",
	"password",
	"refresh_token",
	"serverData",
	"shdf",
	"state",
	"token",
	"usg",
	"vses2",
	"x-client-data",
	// Verkada specific information below
	"lan_auth",	
	"X-Amz-Signature",
	"X-Amz-Credential",
	"X-Amz-Security-Token",
	"X-Amz-SignedHeaders",
	"x-amz-server-side-encryption",
	"x-amz-server-side-encryption-aws-kms-key-id",
	"user_data",
	"x-verkada-token",
	"x-verkada-auth",
	"cookie",
	"vtoolbox.auth-state.roles",
	"intercom-session-q5re5q6g",
	":path",
];

export const defaultScrubItems = [...defaultMimeTypesList, ...defaultWordList];
