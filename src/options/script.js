function save() {
  console.log("saving");
  var apikey=document.getElementById('apikey').value;
  if(apikey)
chrome.storage.local.set({apikey:apikey}, function() {   console.log("saved..");       });

  var secret=document.getElementById('secret').value;
  if(secret)
chrome.storage.local.set({secret:secret}, function() {   console.log("saved..");       });

  var ratio=document.getElementById('r').value;
  if(ratio)
chrome.storage.local.set({ratio:ratio}, function() {   console.log("saved..");       });

  var isChecked=document.getElementById('is-testnet').checked ;
chrome.storage.local.set({isChecked:isChecked}, function() {   console.log("saved..");       });

alert("All settings saved!")
}

window.onload = function () {
  console.log("loading");
  document.getElementById('btn-save').onclick=save;

  chrome.storage.local.get(['apikey','secret','ratio','isChecked'], function(result) {
    if(result.apikey)
    document.getElementById('apikey').value=result.apikey;

    if(result.secret)
    document.getElementById('secret').value=result.secret;

    if(result.ratio)
    document.getElementById('r').value=result.ratio;

    if(result.isChecked!==undefined)
    document.getElementById('is-testnet').checked=result.isChecked;
  });

  
}
