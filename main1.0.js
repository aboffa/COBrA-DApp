$("#actionspanelcustomer").hide();
$("#actionspanelartist").hide();
var web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
console.log(web3);

var CatalogSmartContract;

web3.eth.getAccounts()
    .then(function (data) {
        console.log(data)
        web3.eth.defaultAccount = data[6];
        $("#current-eth-address").text("Hi! Your ETH address is " + web3.eth.defaultAccount);
        return web3.eth.getBalance(web3.eth.defaultAccount);
    })
    .then(function (balance) {
        $("#current-eth-balance").text(" with balance " + web3.utils.fromWei(balance, 'ether') + " Ether");
        $("#current-eth-place").text("on : " + web3.currentProvider.host);
        CatalogSmartContract = new web3.eth.Contract(abiCatalog, catalogAddress);
        console.log(CatalogSmartContract);
        return CatalogSmartContract.methods.isPremium(web3.eth.defaultAccount).call();
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
        $.getJSON("https://raw.githubusercontent.com/aboffa/COBrA/master/prova?token=Aazol3loy3uZAUWP2KIfrEnPbqEvtF_kks5bShcxwA%3D%3D", function (data) {
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
                        .send({ value: 0, gas: 1500000, gasPrice: '100000000000' })
                })
                .then(function (newContractInstance) {
                    console.log(newContractInstance);
                    return CatalogSmartContract.methods.NewContent(newContractInstance.options.address, genrebytes, artistnamebyte, namebyte).call();
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
            CatalogSmartContract.methods.GetContentPremium(namecontentbytes).call()
                .then("content access obtained")
                .catch(err => console.log(err));
        })


        $("#buttontogetcontent").click(function () {

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
            ContentManagementContract.methods.getPriceContent().call()
                .then(function (price) {
                    if (window.confirm("Buying premium costs " + price + " ether. Do you agree?")) {
                        let namecontent = $("#namecontent").val();
                        let namecontentbytes = web3.utils.asciiToHex(namecontent);
                        console.log("price = "+price)
                        /* CatalogSmartContract.methods.GetContent(namecontentbytes)
                            .send()
                            .then("content access obtained")
                            .catch(err => console.log(err));*/
                    }
                })

        })

        $("#buttontogetcontent").click(function () {
            let namecontent = $("#namecontentconsume").val();
            let addresscontent = myContentCache[namecontent];
            if (addresscontent != undefined) {
                let ContentManagementContract = web3.eth.Contract(abiContent, addresscontent);
                ContentManagementContract.methods.retriveContent().call()
                    .then(console.log("obtained"))
                    .catch(err => console.log(err));
            }
        })
    }
}

function setUpEvents() {
    //Setting up events
    CatalogSmartContract.events.ContenAccessObtained(
        function (error, result) {
            if (!error) {
                //$("#loginpanel").append("<div class="alert alert-info"><strong>Info!</strong> New content obtained. </div>");
                console.log("New content avaible ad address" + result);
                alert("New content avaible ad address" + result);
            }
        });
    CatalogSmartContract.events.NewContentEvent(
        function (error, result) {
            if (!error) {
                //$("#loginpanel").append("<div class="alert alert-info"><strong>Info!</strong> New content obtained. </div>");
                alert("New content published" + result);
                console.log("New content published" + result);
            }
        });
}

var myContentCache;