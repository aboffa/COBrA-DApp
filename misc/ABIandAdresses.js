var catalogAddress = "0xd1b75967240282a70cea2e63fb34fee585521402";
var abiCatalog = [{"anonymous":false,"inputs":[{"indexed":false,"name":"genre","type":"bytes32"},{"indexed":false,"name":"autor","type":"bytes32"}],"name":"NewContentEvent","type":"event"},{"constant":false,"inputs":[],"name":"BuyPremium","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"close","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name_","type":"bytes32"}],"name":"GetContent","outputs":[{"name":"cm","type":"address"}],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"name_","type":"bytes32"}],"name":"GetContentPremium","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"name_","type":"bytes32"},{"name":"a","type":"address"}],"name":"GiftContent","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"a","type":"address"}],"name":"GiftPremium","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"s","type":"string"},{"indexed":false,"name":"addr","type":"address"}],"name":"ContenAccessObtained","type":"event"},{"constant":false,"inputs":[{"name":"cmc","type":"address"},{"name":"genre_","type":"bytes32"},{"name":"authorName_","type":"bytes32"},{"name":"name_","type":"bytes32"}],"name":"NewContent","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"s","type":"string"},{"indexed":false,"name":"addr","type":"address"}],"name":"ContenAccessGifted","type":"event"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"constant":true,"inputs":[],"name":"BlockForPremium","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"contentManagers","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"bytes32"}],"name":"fromNametoContent","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"name_","type":"bytes32"}],"name":"getAddressContent","outputs":[{"name":"cm","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"name_","type":"bytes32"}],"name":"getPriceContent","outputs":[{"name":"price","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"a","type":"address"}],"name":"isPremium","outputs":[{"name":"ok","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"premiumCustomers","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"WeiForPremium","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]
var abiContent = [{"constant":true,"inputs":[],"name":"authorAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"catalog","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"}],"name":"setEnabledStandard","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"addr","type":"address"},{"name":"lastblockvalid","type":"uint256"}],"name":"setEnabledPremium","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"genre","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"retriveContentStandard","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"retriveContentPremium","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"authorName","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"data","outputs":[{"name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"AuthorizedPremiumCustomers","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"AuthorizedStandardCustomers","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"inputs":[{"name":"name_","type":"bytes32"},{"name":"genre_","type":"bytes32"},{"name":"data_","type":"bytes32"},{"name":"price_","type":"uint256"},{"name":"authorName_","type":"bytes32"},{"name":"catalog_","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"s","type":"string"}],"name":"canLeaveAFeedBack","type":"event"}]