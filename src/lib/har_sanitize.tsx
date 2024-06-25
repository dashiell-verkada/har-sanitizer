import { Cookie, Har, Header, Param, QueryString } from "har-format";
import { replacementList, defaultImageAndVideoInfo, defaultMimeTypesList, defaultURLSchemas, SanitizeOptions, defaultScrubItems } from "./data";
import type { PossibleScrubItems, URLSchema } from "./data";
// The default list of regexes that aren't word dependent
// Uses double list so it matches format of word regex
const defaultRegex = [
	[
		// Redact signature on JWTs
		{
			regex: new RegExp(
				`\\b(ey[A-Za-z0-9-_=]+)\\.(ey[A-Za-z0-9-_=]+)\\.[A-Za-z0-9-_.+/=]+\\b`,
				"g",
			),
			replacement: `$1.$2.redacted`,
		},
	],
];

function buildRegex(word: string) {
	return [
		{
			// [full word]=[capture]
			regex: new RegExp(
				`([\\s";,&?]+${word}=)([\\w+-_/=#|.%&:!*()\`~'"]+?)(&|\\\\",|",|"\\s|"}}|;){1}`,
				"g",
			),
			replacement: `$1[${word} redacted]$3`,
		},
		// Set up this way in case "value" isn't directly after "name"
		// {
		//    "name": "[word]",
		//    "something": "not wanted",
		//    "value": "[capture]"
		// }
		{
			regex: new RegExp(
				`("name": "${word}",[\\s\\w+:"-\\%!*()\`~'.,#]*?"value": ")([\\w+-_:&\\+=#~/$()\\.\\,\\*\\!|%"'\\s;{}]+?)("[\\s]+){1}`,
				"g",
			),
			replacement: `$1[${word} redacted]$3`,
		},
		// "name" comes after "value"
		// {
		//    "value": "[capture]",
		//    "something": "not wanted",
		//    "name": "[word]"
		// }
		{
			regex: new RegExp(
				`("value": ")([\\w+-_:&+=#$~/()\\\\.\\,*!|%"\\s;]+)("[,\\s}}]+)([\\s\\w+:"-\\\\%!*\`()~'#.]*"name": "${word}")`,
				"g",
			),
			replacement: `$1[${word} redacted]$3$4`,
		},
	];
}
/**
 * Goes through the entries and redacts content based on the mime type; if no mime type is provided, it uses the defaultMimeTypesList.
 * @param {string} input - The input HAR file.
 * @param {string[]} scrubList - The list of mime types to redact. 
 * @returns {string} - The HAR file with the content redacted.
 */
function removeContentForMimeTypes(input: string, scrubList?: string[]) {
	const harJSON = JSON.parse(input);
	const entries = harJSON.log.entries;
	if (!entries) {
		throw new Error("failed to find entries in HAR file");
	}
	if (typeof scrubList === "undefined") scrubList = defaultMimeTypesList;
	// Redact the content of the response and request if the mime type is in the defaultMimeTypesList.
	for (const entry of entries) {
		const response = entry.response;
		const request = entry.request;
		if (response && scrubList.includes(response.content.mimeType)) {
			response.content.text = `[${response.content.mimeType} redacted]`;
		}
		if (request && scrubList.includes(request.postData?.mimeType)) {
			request.postData.text = `[${request.postData.mimeType} redacted]`;
		}
	}

	// Generate RegExp for each word in replacementList and replace them with the redacted version.
	for (const entry of entries){
		const response = entry.response;
		const request = entry.request;
		for (const word of replacementList) {
			const wordRegex = new RegExp(`"${word}":"[|a-zA-Z0-9?;:!@#$%^&*()_+<>{},-]+"`, "g");
			if (response.content?.text){ response.content.text = response.content.text.replaceAll(wordRegex, `"${word}":"[${word} redacted]"`); }
			if (request.postData?.text){ request.postData.text = request.postData.text.replaceAll(wordRegex, `"${word}":"[${word} redacted]"`); }
		}
	} 
	return JSON.stringify(harJSON, null, 2);
}

/**
 * Removes all things in request urls that fit the expression criteria. ATM, just encryption keys for video data. 
 * @param {string} input - The input HAR file.
 * @param {URLSchema[]} URLSchemaList - The list of URL schemas to redact.
 * @returns {string} - The HAR file with the URL content redacted.
 */
function removeURLContent(input: string, URLSchemaList: URLSchema[]){
	const harJSON = JSON.parse(input);
	const entries = harJSON.log.entries;
	if (!entries) {
		throw new Error("failed to find entries in HAR file");
	}
	// Redacts request or response bodies depending on which boolean value is set true in the URL schema list. 
	for (const entry of entries) {
		for (const schema of URLSchemaList) {
			if (schema.redactRequest && schema.exp.test(entry.request.url)) entry.request.postData.text = `[${schema.name} redacted]`;
			if (schema.redactResponse && schema.exp.test(entry.request.url)) entry.response.content.text = `[${schema.name} redacted]`;
		}
	}
	return JSON.stringify(harJSON, null, 2);
}

/** 
 * Removes image and video content from the HAR file.
 * @param {string} input - The input HAR file.
 * @returns {string} - The HAR file with image and video content redacted.
*/
function removeImageAndVideoContent(input: string) {
	const harJSON = JSON.parse(input);
	const entries = harJSON.log.entries;
	if (!entries) {
		throw new Error("failed to find entries in HAR file");
	}
	/*
	** Logic is as follows:
	** 1. Iterate through all entries in the HAR file.
	** 2. Check if the request/response type falls in the defaultImageAndVideoInfo.
	** 3. If it does, redact the request/response content.
	** This also deals with specifically removing thumbnails and websocket messages.
	*/
	for (const entry of entries){
		const response = entry.response;
		const request = entry.request;
		if (/https:\/\/vsubmit\.command\.verkada\.com\/library\/.+/.test(request.url)) request.url = "[vsubmit redacted]";
		for (const schema of defaultImageAndVideoInfo) {
			if (request && schema.includes(request.postData?.mimeType)){ request.postData.text = `[${schema} redacted]`; }
			if (response && schema.includes(response.content?.mimeType)){ response.content.text = `[${schema} redacted]`; }
		}
		if (entry._webSocketMessages) entry._webSocketMessages = { text: "[_webSocketMessages redacted]" };
	}
	
	
	return JSON.stringify(harJSON, null, 2);
}

export function getHarInfo(input: string): PossibleScrubItems {
	const output = {
		headers: new Set<string>(),
		queryArgs: new Set<string>(),
		cookies: new Set<string>(),
		postParams: new Set<string>(),
		mimeTypes: new Set<string>(),
	};
	
	const harJSON: Har = JSON.parse(input);
	const entries = harJSON.log.entries;

	if (!entries) {
		throw new Error("failed to find entries in HAR file");
	}

	for (const entry of entries) {
		const response = entry.response;
		response.headers.map((header: Header) => output.headers.add(header.name));
		response.cookies.map((cookie: Cookie) => output.cookies.add(cookie.name));
		output.mimeTypes.add(response.content.mimeType);

		const request = entry.request;
		request.headers.map((header: Header) => output.headers.add(header.name));
		request.queryString.map((arg: QueryString) =>
			output.queryArgs.add(arg.name),
		);
		request.cookies.map((cookie: Cookie) => output.cookies.add(cookie.name));
		if (request.postData) {
			request.postData.params?.map((param: Param) =>
				output.postParams.add(param.name),
			);
		}
	}

	return {
		headers: [...output.headers].sort(),
		queryArgs: [...output.queryArgs].sort(),
		cookies: [...output.cookies].sort(),
		postParams: [...output.postParams].sort(),
		mimeTypes: [...output.mimeTypes].sort(),
	};
}

function getScrubMimeTypes(
	options?: SanitizeOptions,
	possibleScrubItems?: PossibleScrubItems,
) {
	if (options?.allMimeTypes && !!possibleScrubItems) {
		return possibleScrubItems.mimeTypes;
	}
	return options?.scrubMimetypes || defaultMimeTypesList;
}

function getScrubWords(
	options?: SanitizeOptions,
	possibleScrubItems?: PossibleScrubItems,
) {
	let scrubWords = options?.scrubWords || [];
	if (options?.allCookies && !!possibleScrubItems) {
		scrubWords = scrubWords.concat(possibleScrubItems.cookies);
	}
	if (options?.allHeaders && !!possibleScrubItems) {
		scrubWords = scrubWords.concat(possibleScrubItems.headers);
	}
	if (options?.allQueryArgs && !!possibleScrubItems) {
		scrubWords = scrubWords.concat(possibleScrubItems.queryArgs);
	}
	if (options?.allPostParams && !!possibleScrubItems) {
		scrubWords = scrubWords.concat(possibleScrubItems.postParams);
	}

	return scrubWords || defaultScrubItems;
}

export function sanitize(input: string, options?: SanitizeOptions, removeImageAndVideo?: boolean) {
	console.log("options", JSON.stringify(options, null, 2));
	let possibleScrubItems: PossibleScrubItems | undefined;
	if (
		options?.allCookies ||
		options?.allHeaders ||
		options?.allMimeTypes ||
		options?.allQueryArgs ||
		options?.allPostParams
	) {
	// we have to parse the HAR to get the full list of things we could scrub
		possibleScrubItems = getHarInfo(input);
	}
	// Remove video and image content if the boolean flag is set.
	if (!removeImageAndVideo) { 
		console.log("Removing image and video content")
		input = removeImageAndVideoContent(input);
	}
	
	// Remove confidential mime types
	input = removeContentForMimeTypes(
		input,
		getScrubMimeTypes(options, possibleScrubItems),
	);

	// Remove confidential URLs
	input = removeURLContent(
		input, 
		defaultURLSchemas
	)

	// trim the list of words we are looking for down to the ones actually in the HAR file
	const wordList = getScrubWords(options, possibleScrubItems).filter((val) =>
		input.includes(val),
	);

	// build list of regexes needed to actually scrub the file
	const wordSpecificScrubList = wordList.map((word) => buildRegex(word));
	const allScrubList = defaultRegex.concat(wordSpecificScrubList);

	for (const scrubList of allScrubList) {
		for (const scrub of scrubList) {
			input = input.replace(scrub.regex, scrub.replacement);
		}
	}

	return input;
}
