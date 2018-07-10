$("#actionspanelcustomer").hide();
$("#actionspanelartist").hide();
var web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
console.log(web3);

var CatalogSmartContract;

web3.eth.getAccounts()
    .then(function (data) {
        console.log(data)
        web3.eth.defaultAccount = data[8];
        $("#current-eth-address").text("Hi! Your ETH address is " + web3.eth.defaultAccount);
        return web3.eth.getBalance(web3.eth.defaultAccount);
    })
    .then(function (balance) {
        $("#current-eth-balance").text(" with balance " + web3.utils.fromWei(balance, 'ether') + " Ether");
        $("#current-eth-place").text("on : " + web3.currentProvider.host);
        CatalogSmartContract = new web3.eth.Contract(abiCatalog, catalogAddress);
        console.log(CatalogSmartContract);
        return CatalogSmartContract.methods.isPremium(web3.eth.defaultAccount)
            .call();
    })
    .then(function (isPremium) {
        $("#actionspanelcustomer").show();
        $("#actionspanelartist").show();
        setUpEvents();
        setUpUI(isPremium);

    })
    .catch(err => console.log(err));

function setUpUI(isPremium) {
    //Setting up buttons action

    $("#buttontopublishcontent").click(function () {
        //parse input
        let name = $("#namecontenttopublish").val();
        let namebyte = web3.utils.asciiToHex(name);
        let genre = $("#genrecontent").val();
        let genrebytes = web3.utils.asciiToHex(genre);
        let datacontent = $("#datacontent").val();
        let datacontentbyte = web3.utils.asciiToHex(datacontent);
        let price = $("#pricecontent").val();
        let priceint = Number(web3.utils.toWei(price, 'ether'));
        let artistname = $("#artistname").val();
        let artistnamebyte = web3.utils.asciiToHex(artistname);
        //console.log(name, genre, data, price, artistname);
        let contract;
        //getting the compiled contract
        //Compiled contract with $ solc <contract>.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > <contract>.json
        $.getJSON("https://raw.githubusercontent.com/aboffa/COBrA-DApp/master/Solidity/bin/contentContract.json?token=Aazol4O4RG8PJ9YW6ivip4CwsaY8wpduks5bTaLSwA%3D%3D", function (data) {
            //console.log(data);
            let abi = JSON.parse(data.contracts["ContentManagerContract.sol:ContentManagementContract"].abi);
            let code = '0x' + data.contracts["ContentManagerContract.sol:ContentManagementContract"].bin;
            console.log("Deploying the contract");
            let bytecode = data.contracts["ContentManagerContract.sol:ContentManagementContract"].bytecode;
            web3.eth.estimateGas({ data: bytecode })
                .then(function (gasEstimate) {
                    console.log("" + gasEstimate);
                    let myContract = new web3.eth.Contract(abi, { gas: 30000000, gasPrice: '100000000000', from: web3.eth.defaultAccount });
                    return myContract
                        .deploy({ data: code, arguments: [namebyte, genrebytes, datacontentbyte, priceint, artistnamebyte, catalogAddress] })
                        // no 15*, check effective gas usage
                        .send({ value: 0, gas: 15*gasEstimate, gasPrice: '100000000000' })
                })
                .then(function (newContractInstance) {
                    console.log(newContractInstance);
                    return CatalogSmartContract.methods.NewContent(newContractInstance.options.address, genrebytes, artistnamebyte, namebyte)
                        .send({ from: web3.eth.defaultAccount });
                })
                .then(function () {
                    console.log("Ok");
                })
                .catch(err => console.log(err));
        })
    });

    if (isPremium) {
        //Premium customer
        console.log("Setting up premium ui");
        $("#loginpanel").append("<div class='panel-heading'>Logged in as Premium Account</div>");
        $("#buttontogetaccesscontent").click(function () {
            let namecontent = $("#namecontent").val();
            let namecontentbytes = web3.utils.asciiToHex(namecontent);
            CatalogSmartContract.methods.GetContentPremium(namecontentbytes)
                .send({ value: 0, gas: 1500000, gasPrice: '100000000000', from: web3.eth.defaultAccount })
                .then(function (result) {
                    console.log(result);
                })
                .catch(err => console.log(err));
        }); 

        $("#buttontogetcontent").click(function () {
            let namebytes = web3.utils.asciiToHex($("#buttontogetcontent").val());
            CatalogSmartContract.methods.getAddressContent(namebytes)
                .call()
                .then(function (address) {
                    console.log(address);
                    let ContentManagementContract = web3.eth.Contract(abiContent, address);
                    return ContentManagementContract.methods.retriveContentPremium()
                        .send({  value: 0, gas: 1500000, gasPrice: '100000000000',from: web3.eth.defaultAccount })
                })
                .then(console.log("obtained"))
                .catch(err => console.log(err));
        })
    }
    else {
        //Standard customer
        console.log("Setting up standard ui");
        $("#loginpanel").append("<div id='standard' class='panel-heading'>Logged in as Standard Account</div><button id='buttonforpremium' type='button' class='btn btn-success'>Get Premium Account (1 ETH) </button>");
        $("#buttonforpremium").click(function () {
            if (window.confirm("Buying premium costs 1 ether. Do you agree?")) {
                CatalogSmartContract.methods.BuyPremium().send({ from: web3.eth.defaultAccount, value: web3.utils.toWei("1", "ether") })
                    .then(function (transaction) {
                        //modals
                        alert("Payed 1 Ether! Transaction hash = " + transaction.transactionHash);
                        console.log(transaction)
                        location.reload();
                    })
                    .catch(err => console.log(err));
            }
        });

        $("#buttontogetaccesscontent").click(function () {
            let namecontent = $("#namecontent").val();
            let namecontentbytes = web3.utils.asciiToHex(namecontent);
            CatalogSmartContract.methods.getPriceContent(namecontentbytes)
                .call()
                .then(function (price) {
                    if (window.confirm("Buying this content costs " +  web3.utils.fromWei(price, 'ether') + " ether. Do you agree?")) {
                        CatalogSmartContract.methods.GetContent(namecontentbytes)
                            .send({ value: price, gas: 1500000, gasPrice: '100000000000', from: web3.eth.defaultAccount })
                            .then(function (transaction) {
                                console.log(transaction);
                                alert("Payed "+ web3.utils.fromWei(price, 'ether')+ " Ether! Transaction hash = " + transaction.transactionHash);
                            })
                            .catch(err => console.log(err));
                    }
                })
        });

        $("#buttontogetcontent").click(function () {
            let namebytes = web3.utils.asciiToHex($("#buttontogetcontent").val());
            CatalogSmartContract.methods.getAddressContent(namebytes)
                .call()
                .then(function (address) {
                    console.log(address);
                    let ContentManagementContract = web3.eth.Contract(abiContent, address);
                    return ContentManagementContract.methods.retriveContentStandard()
                        .send({  value: 0, gas: 1500000, gasPrice: '100000000000',from: web3.eth.defaultAccount })
                })
                .then(console.log("obtained"))
                .catch(err => console.log(err));
        })
    }
}

function setUpEvents() {
    //Setting up events

    /*
            CatalogSmartContract.getPastEvents('ContenAccessObtained', {
                fromBlock: 0,
                toBlock: 'latest'
            })
                .then(function (events) {
                    console.log(events) // same results as the optional callback above
                });
 
 
 
var subscription = web3.eth.subscribe('NewContentEvent',
function (error, result) {
if (!error)
    console.log(result);
});
*/
    CatalogSmartContract.events.ContenAccessObtained({ fromBlock: 0 })
        .on('data', function (event) {
            console.log(event); // same results as the optional callback above
        });
    CatalogSmartContract.events.NewContentEvent({ fromBlock: 0 },
        function (error, result) {
            if (!error) {
                //$("#loginpanel").append("<div class="alert alert-info"><strong>Info!</strong> New content obtained. </div>");
                alert("New content published" + result);
                console.log("New content published" + result);
            }
        });
}