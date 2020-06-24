/*chrome.extension.sendMessage({}, function(response) {
	var readyStateCheckInterval = setInterval(function() {
	if (document.readyState === "complete") {
		clearInterval(readyStateCheckInterval);

		// ----------------------------------------------------------
		// This part of the script triggers when page is done loading
		console.log("Hello. This message was sent from scripts/inject.js");
		// ----------------------------------------------------------

	}
	}, 10);
});*/
var total, avail, priceDyn;
$(document).ready(function() {
  loadGlobalElements();
  startEventListening();
  connectToExtention();


});

function connectToExtention() {

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

			switch (request.cmd) {
				case  "getprice":
				sendResponse({
					price: priceDyn.text()
				});
					break;
				case  "getcapital":
				var totalT = total.text().split(' ');
				sendResponse({
					capital:getPrice(totalT[0], totalT[1]),
					price: priceDyn.text()
				});
					break;
				default:

			}

    });
}

function priceChanged() {
  //Setting total and available money
  updateAccountConversion();


}

function updateAccountConversion() {
  var totalT = total.text().split(' ');
  total.text(totalT[0] + " " + totalT[1] + " (" + getPrice(totalT[0], totalT[1]) + "$)");
  var availT = total.text().split(' ');
  avail.text(availT[0] + " " + availT[1] + " (" + getPrice(availT[0], availT[1]) + "$)");
}

function getPrice(number, currencyDisplay) {
  var mult = 1;
  if (currencyDisplay) {
    if (currencyDisplay.endsWith('XBt')) {
      mult = 0.00000001;
    } else if (currencyDisplay.endsWith('μXBT')) {
      mult = 0.000001;
    } else if (currencyDisplay.endsWith('mXBT')) {
      mult = 0.001;
    }
  }
  return (parseFloat(number.replace(/,/g, '')) * mult * parseFloat(priceDyn.text())).toFixed(2);
}

function startEventListening() {
  total.on('DOMSubtreeModified', function() {
    if (total.text().includes('(') || !total.text()) return;
    updateAccountConversion()
  });
  avail.on('DOMSubtreeModified', function() {
    if (avail.text().includes('(') || !avail.text()) return;
    updateAccountConversion()
  });

  priceDyn.on('DOMSubtreeModified', function() {
    priceChanged();
  });
}

function loadGlobalElements() {
  priceDyn = $("#content > div > div.tickerBar.overflown > div > span.instruments.tickerBarSection > span:nth-child(1) > span.price");
  total = $("#header > div.Header__Header__rightWrap__2UCMY > a.Header__Header__margin__1mNCX.noHover > span > table > tbody > tr:nth-child(1) > td:nth-child(2)");
  avail = $("#header > div.Header__Header__rightWrap__2UCMY > a.Header__Header__margin__1mNCX.noHover > span > table > tbody > tr:nth-child(2) > td:nth-child(2)");
}
