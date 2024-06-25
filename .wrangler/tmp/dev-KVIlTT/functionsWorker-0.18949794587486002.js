// .wrangler/tmp/bundle-GvKRDD/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/pages-jS5pkK/functionsWorker-0.18949794587486002.mjs
var urls2 = /* @__PURE__ */ new Set();
function checkURL2(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls2.has(url.toString())) {
      urls2.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL2(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});
var defaultURLSchemas = [
  {
    name: "v-media",
    exp: /https:\/\/vmedia\.command\.verkada\.com\/library\/enckey/,
    redactRequest: false,
    redactResponse: true
  }
];
var defaultImageAndVideoInfo = [
  "application/x-mpegurl",
  "application/json",
  "application/octet-stream"
];
var defaultMimeTypesList = [
  "application/javascript",
  "text/javascript",
  "image/jpeg",
  "image/webp",
  "text/css"
];
var replacementList = [
  "lanServerAuth",
  "auth",
  "credential",
  "url",
  "password"
];
var defaultWordList = [
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
  ":path"
];
var defaultScrubItems = [...defaultMimeTypesList, ...defaultWordList];
var defaultRegex = [
  [
    // Redact signature on JWTs
    {
      regex: new RegExp(
        `\\b(ey[A-Za-z0-9-_=]+)\\.(ey[A-Za-z0-9-_=]+)\\.[A-Za-z0-9-_.+/=]+\\b`,
        "g"
      ),
      replacement: `$1.$2.redacted`
    }
  ]
];
function buildRegex(word) {
  return [
    {
      // [full word]=[capture]
      regex: new RegExp(
        `([\\s";,&?]+${word}=)([\\w+-_/=#|.%&:!*()\`~'"]+?)(&|\\\\",|",|"\\s|"}}|;){1}`,
        "g"
      ),
      replacement: `$1[${word} redacted]$3`
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
        "g"
      ),
      replacement: `$1[${word} redacted]$3`
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
        "g"
      ),
      replacement: `$1[${word} redacted]$3$4`
    }
  ];
}
function removeContentForMimeTypes(input, scrubList) {
  const harJSON = JSON.parse(input);
  const entries = harJSON.log.entries;
  if (!entries) {
    throw new Error("failed to find entries in HAR file");
  }
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
  for (const entry of entries) {
    const response = entry.response;
    const request = entry.request;
    for (const word of replacementList) {
      const wordRegex = new RegExp(`"${word}":"[|a-zA-Z0-9?;:!@#$%^&*()_+<>{},-]+"`, "g");
      if (response.content?.text) {
        response.content.text = response.content.text.replaceAll(wordRegex, `"${word}":"[${word} redacted]"`);
      }
      if (request.postData?.text) {
        request.postData.text = request.postData.text.replaceAll(wordRegex, `"${word}":"[${word} redacted]"`);
      }
    }
  }
  return JSON.stringify(harJSON, null, 2);
}
function removeURLContent(input, URLSchemaList) {
  const harJSON = JSON.parse(input);
  const entries = harJSON.log.entries;
  if (!entries) {
    throw new Error("failed to find entries in HAR file");
  }
  for (const entry of entries) {
    for (const schema of URLSchemaList) {
      if (schema.redactRequest && schema.exp.test(entry.request.url))
        entry.request.postData.text = `[${schema.name} redacted]`;
      if (schema.redactResponse && schema.exp.test(entry.request.url))
        entry.response.content.text = `[${schema.name} redacted]`;
    }
  }
  return JSON.stringify(harJSON, null, 2);
}
function removeImageAndVideoContent(input) {
  const harJSON = JSON.parse(input);
  const entries = harJSON.log.entries;
  if (!entries) {
    throw new Error("failed to find entries in HAR file");
  }
  for (const entry of entries) {
    const response = entry.response;
    const request = entry.request;
    for (const schema of defaultImageAndVideoInfo) {
      if (request && schema.includes(request.postData?.mimeType)) {
        request.postData.text = `[${schema} redacted]`;
      }
      if (response && schema.includes(response.content?.mimeType)) {
        response.content.text = `[${schema} redacted]`;
      }
    }
  }
  return JSON.stringify(harJSON, null, 2);
}
function getHarInfo(input) {
  const output = {
    headers: /* @__PURE__ */ new Set(),
    queryArgs: /* @__PURE__ */ new Set(),
    cookies: /* @__PURE__ */ new Set(),
    postParams: /* @__PURE__ */ new Set(),
    mimeTypes: /* @__PURE__ */ new Set()
  };
  const harJSON = JSON.parse(input);
  const entries = harJSON.log.entries;
  if (!entries) {
    throw new Error("failed to find entries in HAR file");
  }
  for (const entry of entries) {
    const response = entry.response;
    response.headers.map((header) => output.headers.add(header.name));
    response.cookies.map((cookie) => output.cookies.add(cookie.name));
    output.mimeTypes.add(response.content.mimeType);
    const request = entry.request;
    request.headers.map((header) => output.headers.add(header.name));
    request.queryString.map(
      (arg) => output.queryArgs.add(arg.name)
    );
    request.cookies.map((cookie) => output.cookies.add(cookie.name));
    if (request.postData) {
      request.postData.params?.map(
        (param) => output.postParams.add(param.name)
      );
    }
  }
  return {
    headers: [...output.headers].sort(),
    queryArgs: [...output.queryArgs].sort(),
    cookies: [...output.cookies].sort(),
    postParams: [...output.postParams].sort(),
    mimeTypes: [...output.mimeTypes].sort()
  };
}
function getScrubMimeTypes(options, possibleScrubItems) {
  if (options?.allMimeTypes && !!possibleScrubItems) {
    return possibleScrubItems.mimeTypes;
  }
  return options?.scrubMimetypes || defaultMimeTypesList;
}
function getScrubWords(options, possibleScrubItems) {
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
function sanitize(input, options, removeImageAndVideo) {
  console.log("options", JSON.stringify(options, null, 2));
  let possibleScrubItems;
  if (options?.allCookies || options?.allHeaders || options?.allMimeTypes || options?.allQueryArgs || options?.allPostParams) {
    possibleScrubItems = getHarInfo(input);
  }
  if (!removeImageAndVideo) {
    input = removeImageAndVideoContent(input);
  }
  input = removeContentForMimeTypes(
    input,
    getScrubMimeTypes(options, possibleScrubItems)
  );
  input = removeURLContent(
    input,
    defaultURLSchemas
  );
  const wordList = getScrubWords(options, possibleScrubItems).filter(
    (val) => input.includes(val)
  );
  const wordSpecificScrubList = wordList.map((word) => buildRegex(word));
  const allScrubList = defaultRegex.concat(wordSpecificScrubList);
  for (const scrubList of allScrubList) {
    for (const scrub of scrubList) {
      input = input.replace(scrub.regex, scrub.replacement);
    }
  }
  return input;
}
function jsonError(msg, status) {
  return new Response(JSON.stringify({ err: msg }), {
    status: status || 400,
    headers: { "content-type": "application/json" }
  });
}
var onRequest = async (ctx) => {
  const req = ctx.request;
  if (req.method != "POST") {
    return jsonError("please post the HAR file to this endpoint");
  }
  let body;
  try {
    body = await req.json();
  } catch (e) {
    console.log(e);
    return jsonError("failed to parse json body");
  }
  if (!body) {
    return jsonError("missing post body");
  }
  if (!body.har) {
    return jsonError("body should be json and have a har field");
  }
  try {
    const harInput = JSON.stringify(body.har, null, 2);
    const scrubbed = sanitize(harInput, {
      scrubWords: body.words,
      scrubMimetypes: body.mime_types,
      allCookies: body.all_cookies,
      allHeaders: body.all_headers,
      allMimeTypes: body.all_mimetypes,
      allQueryArgs: body.all_queryargs,
      allPostParams: body.all_postparams
    });
    return new Response(JSON.stringify(JSON.parse(scrubbed), null, 2));
  } catch (e) {
    return jsonError(`failed to scrub har file: ${e}`, 500);
  }
};
var routes = [
  {
    routePath: "/scrub",
    mountPath: "/",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a;
  var defaultPattern = "[^".concat(escapeString(options.delimiter || "/#?"), "]+?");
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  };
  var mustConsume = function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  };
  var consumeText = function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  };
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    };
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            route += "((?:".concat(token.pattern, ")").concat(token.modifier, ")");
          } else {
            route += "(".concat(token.pattern, ")").concat(token.modifier);
          }
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: () => {
            isFailOpen = true;
          }
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    };
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = (response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
);
var drainBody = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
};
var middleware_ensure_req_body_drained_default = drainBody;
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
var jsonError2 = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
};
var middleware_miniflare3_json_error_default = jsonError2;
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  ...[],
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  };
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      };
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody2 = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
};
var middleware_ensure_req_body_drained_default2 = drainBody2;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError2(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError2(e.cause)
  };
}
var jsonError3 = async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError2(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
};
var middleware_miniflare3_json_error_default2 = jsonError3;

// .wrangler/tmp/bundle-GvKRDD/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__2 = [
  ...void 0 ?? [],
  middleware_ensure_req_body_drained_default2,
  middleware_miniflare3_json_error_default2
];
var middleware_insertion_facade_default2 = middleware_loader_entry_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__2 = [];
function __facade_register__2(...args) {
  __facade_middleware__2.push(...args.flat());
}
function __facade_invokeChain__2(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__2(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
function __facade_invoke__2(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__2(request, env, ctx, dispatch, [
    ...__facade_middleware__2,
    finalMiddleware
  ]);
}

// .wrangler/tmp/bundle-GvKRDD/middleware-loader.entry.ts
var __Facade_ScheduledController__2 = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__2)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler2(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  const fetchDispatcher = function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  };
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__2(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      };
      return __facade_invoke__2(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
function wrapWorkerEntrypoint2(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__2 === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__2.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__2) {
    __facade_register__2(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__2(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__2(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
var WRAPPED_ENTRY2;
if (typeof middleware_insertion_facade_default2 === "object") {
  WRAPPED_ENTRY2 = wrapExportedHandler2(middleware_insertion_facade_default2);
} else if (typeof middleware_insertion_facade_default2 === "function") {
  WRAPPED_ENTRY2 = wrapWorkerEntrypoint2(middleware_insertion_facade_default2);
}
var middleware_loader_entry_default2 = WRAPPED_ENTRY2;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__2 as __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default2 as default
};
//# sourceMappingURL=functionsWorker-0.18949794587486002.js.map
