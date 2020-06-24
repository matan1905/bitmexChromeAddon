
$(document).ready(function() {
setOnCurrentEntryPriceClick();
setOnBuyClick();
setOnSellClick();
setOnScaleOrderClick();
syncAllInputs();

// if(!setVars()){
//   showError("Please set your apiKey and/or apiSecret in the options screen");
// }
});

function syncAllInputs() {
$('input').each(function () {
  var id=$(this).attr('id');
  var element=this;
          chrome.storage.local.get([id], function(result) {
            if(result[id])
            $(element).val(result[id]);
          });
});

$('input').change(function () {

  toSet={};
  toSet[$(this).attr('id')]= $(this).val();
    chrome.storage.local.set(toSet, function() {   console.log("saved..");       });
});


}



function setOnScaleOrderClick() {
  $('#scale-order').on('click',function() {
    getPriceAndCapital(function (res) {
      scaledOrder(parseFloat($('#dist').val()),parseFloat($('#dist-max').val()),parseInt($('#steps').val()),
      parseFloat(res.price),$( '#scaled-buy' ).is( ":checked" ),$( '#scaled-sell' ).is( ":checked" ),
      parseFloat($('#scaled-dstop').val()), parseFloat($('#risk').val()),res.capital);
      //(dist,distMax,steps,price,buy,sell,dstop,risk)
    });
  });
}
function setOnBuyClick() {
  $('#risk-managment-buy').on('click',function() {
    getPriceAndCapital(function (res) {
      var entry=round($('#entry').val().length>0?$('#entry').val():res.price,0.5);
      var stopPrice =round(entry-round($('#dstop').val()),0.5);
      var takeProfit = round(entry+ R * $('#dstop').val(),0.5);
      var numFees=0;
      numFees+=$( '#include-market-fees' ).is( ":checked" )?1:0;
      numFees+=$('#entry').val().length>0?0:1; //if entry is empty, that is a market order
      var position= calcPositionSize(numFees,
      $('#risk').val(),entry,stopPrice,res.capital);

      orders = {orders:[orderPosition(entry,'Buy',position),
     orderStoploss(stopPrice,'Sell',position),
        orderTakeProfit(takeProfit,'Sell',position)]};
        makeRequest('POST','/order/bulk',orders,console.log);

    });
  });
}



function setOnSellClick() {
  $('#risk-managment-sell').on('click',function() {
  getPriceAndCapital(function (res) {

      var entry=round($('#entry').val().length>0?$('#entry').val():res.price,0.5);
      var stopPrice =round(entry+round($('#dstop').val()),0.5);
      var takeProfit = round(entry- R * $('#dstop').val(),0.5);
      var numFees=0;
      numFees+=$( '#include-market-fees' ).is( ":checked" )?1:0;
      numFees+=$('#entry').val().length>0?0:1; //if entry is empty, that is a market order

      var position= calcPositionSize(numFees,
      $('#risk').val(),entry,stopPrice,res.capital);
      orders = {orders:[orderPosition(entry,'Sell',position),
     orderStoploss(stopPrice,'Buy',position),
        orderTakeProfit(takeProfit,'Buy',position)]};
        makeRequest('POST','/order/bulk',orders,console.log);
    });
  });
}
function setOnCurrentEntryPriceClick() {
  $('#set-entry-price-to-current').on('click', function() {
    getPriceAndCapital(function (response) {
      $('#entry').val(response.price);
    });
  });
}

function scaledOrder(dist,distMax,steps,price,buy,sell,dstop,risk,capital) {

//distance between start and finish
//posiztion (risk) (entry is auto, stop is decided by risk )
//N of orders (2N)



//Assume we calculated everything, all we gotta do now is create the orders:
// sell-range(top,price+dist), buy-range(price-dist,bottom) and also two stops for each side.
steps = Math.min(steps,(distMax-dist)*2);
var orders=[];
var sumOfSteps=(steps*(steps+1))/2;
var priceInc=(distMax-dist)/(steps-1);
var avgBuy=0,avgSell=0;

//Calculating average price to calculate stop later
for(var i=0;i<steps;i++){
  var partial=(i+1)/sumOfSteps
  var buyPrice=round(price-dist-priceInc*i,0.5);
  var sellPrice=round(price+dist+priceInc*i,0.5);
  avgBuy+=buyPrice*(partial);
  avgSell+=sellPrice*(partial);
}

var pos=calcPositionSize(1,risk,avgBuy,price-dstop,capital)/2;


var posLeft=pos;
for(var i=0;i<steps;i++){
  var partialPos=Math.max(Math.floor((i+1)*pos/sumOfSteps),1);
  posLeft-= partialPos;
  if(i==steps-1) partialPos+=posLeft;//making sure that not a singel dollar escapes this madness!

  var buyPrice=round(price-dist-priceInc*i,0.5);
  var sellPrice=round(price+dist+priceInc*i,0.5);
  if(buy) orders.push(orderPosition(buyPrice,'Buy',partialPos));
  if(sell) orders.push(orderPosition(sellPrice,'Sell',partialPos));


}
if(buy) orders.push(orderStoploss(price-dstop,'Sell',pos));
if(sell) orders.push(orderStoploss(price+dstop,'Buy',pos));


makeRequest('POST','/order/bulk',{orders:orders},console.log);

}

const MARKET_ORDER_FEES = 0.00075;//0.075%
function calcPositionSize(numMarketOrders,risk,entryPrice,stopPrice,capital) {
  var riskP = risk/100;//converting risk to precentage
  var fees=numMarketOrders*MARKET_ORDER_FEES;//calculate fees in precentage
  var riskAmount =  capital*riskP ;//not including fees
  var distanceToStop= Math.abs(1-(stopPrice/entryPrice));
  return Math.floor((riskAmount/distanceToStop)/(1+(1-distanceToStop)*fees)); //Position Size = Risk Amount/Distance to Stop Loss
}

function orderTakeProfit(takeprofit,side,positionSize) {
  var half = side=='Buy'?0.5:-0.5;
data = {symbol:'XBTUSD',side:side,ordType:'LimitIfTouched',
orderQty:positionSize,stopPx:takeprofit+half,price:takeprofit,execInst:'ReduceOnly,LastPrice'};
return data;
//makeRequest('POST','/order',data);
}
function orderStoploss(stoploss,side,positionSize) {
  data={symbol:'XBTUSD',side:side,ordType:'Stop',
  orderQty:positionSize,stopPx:stoploss,execInst:'ReduceOnly,LastPrice'};
  return data;
//makeRequest('POST','/order',data);
}
function orderPosition(price,side,positionSize) {
  data={symbol:'XBTUSD',side:side,
  orderQty:positionSize,price:price};
  return data;
  //makeRequest('POST','/order',data);
}
function sendCommand(cmd,callback) {
  showError(false);
  chrome.tabs.query({  active: true,currentWindow: true  }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {  cmd: cmd  }, function(response) {
      if(response) callback(response);
      else showError("Please make sure you are in bitmex tab")
    });
  });
}
function showError(msg) {
  if(msg){
    $('#error').show();
    $('#error').text(msg);
  }
  else {
    $('#error').hide();
  }

}


 function getPriceAndCapital(callback) {
  var res ={};
  makeRequest('GET', '/trade', {count:1,symbol:'XBT',reverse:true},function (resOne) {
    console.log(resOne);
    res.price = resOne[0].price;
     makeRequest('GET', '/user/wallet', {currency:'XBt'},function (resTwo) {
       console.log(resTwo);
      res.capital = resTwo.amount * 0.00000001 * res.price;//capital in dollars
      callback(res);
    });
  });
}
