
var testnet=false;
var bitmexURL= testnet? 'https://testnet.bitmex.com':'https://www.bitmex.com';
var apiKey='.';//.
var apiSecret='.';//.
var R=2;

function setVars() {
  chrome.storage.local.get(['apikey','secret','ratio','isChecked'], function(result) {
    console.log(result);
    if(result.apikey)
    apiKey=result.apikey;
    else return false;

    if(result.secret)
    apiSecret=result.secret;
    else return false;

    if(result.ratio)
    R=result.ratio;

    if(result.isChecked!==undefined)
    testnet=result.isChecked;

    return true;
  });
return true;

}
function makeRequest(verb, endpoint, data = {},callback=null) {
  const apiRoot = '/api/v1/';

  const expires = Math.round(new Date().getTime() / 1000) + 60; // 1 min in the future
  let query = '', postBody = '';
  if (verb === 'GET')
    query = '?' + $.param(data);//!
  else
    // Pre-compute the reqBody so we can be sure that we're using *exactly* the same body in the request
    // and in the signature. If you don't do this, you might get differently-sorted keys and blow the signature.
    postBody = JSON.stringify(data);


  const signature =CryptoJS.HmacSHA256(verb + apiRoot + endpoint + query + expires + postBody, apiSecret).toString(CryptoJS.enc.Hex);// crypto.createHmac('sha256', apiSecret).update().digest('hex');

  const headers = {
    'content-type': 'application/json',
    'accept': 'application/json',
    // This example uses the 'expires' scheme. You can also use the 'nonce' scheme. See
    // https://www.bitmex.com/app/apiKeysUsage for more details.
    'api-expires': expires,
    'api-key': apiKey,
    'api-signature': signature,
  };

  const requestOptions = {
    method: verb,
    headers,
  };
  if (verb !== 'GET') requestOptions.body = postBody;  // GET/HEAD requests can't have body

  const url = bitmexURL + apiRoot + endpoint + query;

  return fetch(url, requestOptions).then(response => response.json()).then(
    response => {
      if ('error' in response) {
			console.log(response.error.message);
      console.log(response);
			return null;
		}
    if(callback) callback(response);
      return response;
    },
    error => console.error('Network error', error),
  );
}


function round(value, step) {
    step || (step = 1.0);
    var inv = 1.0 / step;
    return Math.round(value * inv) / inv;
}
