/*jshint esversion: 6 */
$("#actionspanelcustomer").hide();
$("#actionspanelartist").hide();
$("#actionspanelstatistic").hide();
var web3 = new Web3(Web3.givenProvider || new Web3.providers.WebsocketProvider('ws://127.0.0.1:8545'));
console.log(web3);

var CatalogSmartContract;
web3.eth.getAccounts()
    .then(function (data) {
        console.log(data);
        web3.eth.defaultAccount = data[4];
        $("#current-eth-address").text("Hi! Your ETH address is " + web3.eth.defaultAccount);
        return web3.eth.getBalance(web3.eth.defaultAccount);
    })
    .then(function (balance) {
        $("#current-eth-balance").text(" with balance " + web3.utils.fromWei(balance, 'ether') + " Ether");
        if (web3.currentProvider.host != undefined) {
            $("#current-eth-place").text("on : " + web3.currentProvider.host);
        }
        CatalogSmartContract = new web3.eth.Contract(abiCatalog, catalogAddress);
        console.log(CatalogSmartContract);
        return CatalogSmartContract.methods.isPremium(web3.eth.defaultAccount)
            .call();
    })
    .then(function (isPremium) {
        $("#actionspanelcustomer").show();
        $("#actionspanelartist").show();
        $("#actionspanelstatistic").show();
        $("#loginpanel").css('background-color', '#C8E6C9');
        setUpEvents();
        setUpUI(isPremium);

    })
    .catch(function (err) {
        console.log(err);
        $("#loginpanel").attr("class", "card text-white bg-danger mb-3");
        $("#loginpanel").append("<h3 class='card-text'>" + err.toString() + "<\h3>");
    });

function setUpUI(isPremium) {
    //Setting up Buttons action
    //Button action for Artist Panel
    $("#buttontopublishcontent").click(function () {
        //parse input
        let name = $("#namecontenttopublish").val();
        let genre = $("#genrecontent").val();
        let artist = $("#artistname").val();
        if (name == "" || genre == "" || artist == "") {
            displayErrorAfterButton("publishpanel", "Please insert name, genre and your artist name");
        }
        else {
            let namebyte = web3.utils.asciiToHex(name);
            let genrebytes = web3.utils.asciiToHex(genre);
            let priceint = Number(web3.utils.toWei($("#pricecontent").val(), 'ether'));
            let artistnamebyte = web3.utils.asciiToHex(artist);
            //console.log(name, genre, data, price, artistname);
            //getting the compiled contract
            //Compiled contract with $ solc <contract>.sol --combined-json abi,asm,ast,bin,bin-runtime,clone-bin,devdoc,interface,opcodes,srcmap,srcmap-runtime,userdoc > <contract>.json
            $.getJSON("./misc/contentContract.json",
                function (data) {
                    console.log(data);
                    let abi = JSON.parse(data.contracts["ContentManagerContract.sol:ContentManagementContract"].abi);
                    let code = '0x' + data.contracts["ContentManagerContract.sol:ContentManagementContract"].bin;
                    console.log("Deploying the contract");
                    let bytecode = data.contracts["ContentManagerContract.sol:ContentManagementContract"].bytecode;
                    web3.eth.estimateGas({ data: bytecode })
                        .then(function (gasEstimate) {
                            console.log(gasEstimate);
                            let myContract = new web3.eth.Contract(abi, { gas: 5000000, gasPrice: '2000000000', from: web3.eth.defaultAccount });
                            console.log(myContract);
                            return myContract
                                .deploy({ data: code, arguments: [namebyte, genrebytes, priceint, artistnamebyte, catalogAddress] })
                                // no 15*, check effective gas usage
                                .send();
                        })
                        .catch(function (err) {//debug
                            console.log("error while creating \n" + err);
                            return;
                        })
                        .then(function (newContractInstance) {
                            console.log(newContractInstance);
                            return CatalogSmartContract.methods.NewContent(newContractInstance.options.address, genrebytes, artistnamebyte)
                                .send({ from: web3.eth.defaultAccount });
                        })
                        .then(function () {
                            console.log("Ok");
                            alert("Content " + name + " published!");
                            $("#namecontenttopublish").val("");
                            $("#genrecontent").val("");
                            $("#artistname").val("");
                            $("#pricecontent").val("0.01");
                        })
                        .catch(err => console.log(err));//better error
                });
        }
    });
    // Buttons for gifts 
    $("#buttontogiftcontent").click(function () {
        let namebytes = web3.utils.asciiToHex($("#namecontentgift").val());
        let address = $("#namerecipient").val();
        if (web3.utils.isAddress(address)) {
            CatalogSmartContract.methods.isPremium(address)
                .call()
                .then(function (isPremium) {
                    if (!isPremium) {
                        CatalogSmartContract.methods.getPriceContent(namebytes)
                            .call()
                            .then(function (price) {
                                if (window.confirm("You are gifting a content to " + address + ". Buying this content costs " + web3.utils.fromWei(price, 'ether') + " ether. Do you agree?")) {
                                    CatalogSmartContract.methods.GiftContent(namebytes, address)
                                        .send({ value: price, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount })
                                        .then(function (result) {
                                            alert("Gifted!");
                                            console.log(result);
                                        });
                                }
                            })
                            .catch(function (err) {
                                displayErrorInForm("namecontentgift", "This content doesn't exist.");
                                console.log(err);
                            });
                    }
                    else {
                        displayErrorInForm("namerecipient", "Customer " + address + " is premium. He already has access to all content.");
                    }
                })
                .catch(err => console.log(err));

        } else {
            displayErrorInForm("namerecipient", "Invalid Address.");
        }
    });
    $("#buttontogiftpremium").click(function () {
        let address = $("#namerecipientaddress").val();
        if (web3.utils.isAddress(address)) {
            CatalogSmartContract.methods.isPremium(address)
                .call()
                .then(function (isPremium) {
                    if (!isPremium) {
                        if (window.confirm("You are gifting a premium account to " + address + ". Buying premium costs 1 ether. Do you agree?")) {
                            CatalogSmartContract.methods.GiftPremium(address)
                                .send({ value: web3.utils.toWei("1", "ether"), gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount })
                                .then(function (result) {
                                    alert("Gifted!");
                                    console.log(result);
                                });
                        }
                    }
                    else {
                        displayErrorInForm("namerecipientaddress", "Customer " + address + " is premium. He already has access to all content.");
                    }
                })
                .catch(err => console.log(err));
        } else {
            displayErrorInForm("namerecipientaddress", "Invalid Address.");
        }
    });
    // Buttons action for Statistic panel
    $("#buttontogetstatisticsviws").click(function () {
        var contentList;
        CatalogSmartContract.methods.GetContentList()
            .call()
            .then(function (result) {
                contentList = result;
            })
            .then(function () {
                return CatalogSmartContract.methods.GetStatistics()
                    .call();
            }).then(function (result) {
                var totalstring = "";
                for (var i = 0; i < contentList.length; i++) {
                    let namestring = web3.utils.hexToAscii(contentList[i]);
                    console.log(namestring + "  views = " + result[i]);
                    totalstring += (namestring + "  views = " + result[i] + "\n");
                }
                alert("Result : \n" + totalstring);
            })
            .catch(err => console.log(err));
    });
    $("#buttontogetstatisticscontentlist").click(function () {
        CatalogSmartContract.methods.GetContentList()
            .call()
            .then(function (result) {
                var totalstring = "";
                for (var i = 0; i < result.length; i++) {
                    let namestring = web3.utils.hexToAscii(result[i]);
                    totalstring += (namestring + "\n");
                }
                alert("Result : \n" + totalstring);
            })
            .catch(err => console.log(err));
    });

    $("#buttontogetfeedbacks").click(function () {
        var contentList;
        CatalogSmartContract.methods.GetContentList()
            .call()
            .then(function (result) {
                contentList = result;
            });
        console.log($("#feedbacktoget").prop('selectedIndex'));
        if ($("#feedbacktoget").prop('selectedIndex') == 0) {
            CatalogSmartContract.methods.GetFeedBacks()
                .call()
                .then(function (result) {
                    var totalstring = "";
                    for (var i = 0; i < contentList.length; i++) {
                        let namestring = web3.utils.hexToAscii(contentList[i]);
                        console.log(namestring + "  views = " + result[i] + " " + (result[i] / 1000));
                        totalstring += (namestring + "  all feedback mean = " + result[i] / 1000 + "\n");
                    }
                    alert("Result : \n" + totalstring);
                    return;
                })
                .catch(err => console.log(err));
        }
        if ($("#feedbacktoget").prop('selectedIndex') == 1) {
            CatalogSmartContract.methods.GetFeedBack1()
                .call()
                .then(function (result) {
                    var totalstring = "";
                    for (var i = 0; i < contentList.length; i++) {
                        let namestring = web3.utils.hexToAscii(contentList[i]);
                        console.log(namestring + "  views = " + result[i] + " " + (result[i] / 1000));
                        totalstring += (namestring + "  'Appreciation of the content' feedback mean = " + result[i] / 1000 + "\n");
                    }
                    alert("Result : \n" + totalstring);
                    return;
                })
                .catch(err => console.log(err));
        }
        if ($("#feedbacktoget").prop('selectedIndex') == 2) {
            CatalogSmartContract.methods.GetFeedBack2()
                .call()
                .then(function (result) {
                    var totalstring = "";
                    for (var i = 0; i < contentList.length; i++) {
                        let namestring = web3.utils.hexToAscii(contentList[i]);
                        console.log(namestring + "  views = " + result[i] + " " + (result[i] / 1000));
                        totalstring += (namestring + "  'Price fairness' feedback mean = " + result[i] / 1000 + "\n");
                    }
                    alert("Result : \n" + totalstring);
                    return;
                })
                .catch(err => console.log(err));
        }
        if ($("#feedbacktoget").prop('selectedIndex') == 3) {
            CatalogSmartContract.methods.GetFeedBack3()
                .call()
                .then(function (result) {
                    var totalstring = "";
                    for (var i = 0; i < contentList.length; i++) {
                        let namestring = web3.utils.hexToAscii(contentList[i]);
                        console.log(namestring + "  views = " + result[i] + " " + (result[i] / 1000));
                        totalstring += (namestring + "  'Originality of the content' feedback mean = " + result[i] / 1000 + "\n");
                    }
                    alert("Result : \n" + totalstring);
                    return;
                })
                .catch(err => console.log(err));
        }
    });

    $("#buttontonotify").click(function () {
        let name = $("#nameauthornotify").val();
        let genre_ = $("#namegenrenotify").val();
        if (name == "" && genre_ == "") {
            displayErrorAfterButton("notifypanel", "Please insert a name of Author o a Genre");
        }
        else {
            if (name != "") {
                alert("Subscribed to content published by " + name);
                CatalogSmartContract.events.NewContentEvent(//{
                    //filter: { autor: nameauthor } , <- doesn't work so I did it by myself
                    //}
                )
                    .on('data', function (event) {
                        if (web3.utils.hexToAscii(event.returnValues.autor).localeCompare(name) == 0) {
                            alert("New content published from " + name);
                            console.log(event);
                        }
                    })
                    .on('error', console.error);
            }
            if (genre_ != "") {
                alert("Subscribed to content of genre " + genre_);
                CatalogSmartContract.events.NewContentEvent()
                    .on('data', function (event) {
                        if (web3.utils.hexToAscii(event.returnValues.genre).localeCompare(genre_) == 0) {
                            alert("New content published of genre " + genre_);
                            console.log(event);
                        }
                    })
                    .on('error', console.error);
            }
        }
    });
    $("#buttontofeedback").click(function () {
        let content = $("#namefeedback").val();
        if (content == "") {
            displayErrorAfterButton("feedbackpanel", "Please select wich content you want to feedback");
        }
        else {
            let f1 = $("#feedback1").val();
            let f2 = $("#feedback2").val();
            let f3 = $("#feedback3").val();
            console.log(f1, f2, f3);
            let contentbytes = web3.utils.asciiToHex(content);
            CatalogSmartContract.methods.getAddressContent(contentbytes)
                .call()
                .then(function (address) {
                    let ContentManagementContract = new web3.eth.Contract(abiContent, address);
                    if (isPremium) {
                        return ContentManagementContract.methods.LeaveFeedBackPremium(f1, f2, f3)
                            .send({ value: 0, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount });
                    }
                    else {
                        return ContentManagementContract.methods.LeaveFeedBackStandard(f1, f2, f3)
                            .send({ value: 0, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount });
                    }
                })
                .then(function (transaction) {
                    console.log(transaction);
                    alert("Feedback sent! Thank's!");
                })
                .catch(function (err) {
                    console.log(err);
                    displayErrorAfterButton("feedbackpanel", "Error sending feedback, have you consumed this content?");
                });
        }
    });
    if (isPremium) {
        //Button action for Premium customer
        console.log("Setting up premium ui");
        $("#loginpanel").append("<div class='card-body text-success'> <div class='card-header'> <h5 class='card-title'>Logged as Premium Account</h5> </div> </div> ");
        $("#buttontogetaccesscontent").click(function () {
            let namecontent = $("#namecontent").val();
            let namecontentbytes = web3.utils.asciiToHex(namecontent);
            CatalogSmartContract.methods.GetContentPremium(namecontentbytes)
                .send({ value: 0, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount })
                .then(function (result) {
                    console.log(result);
                    alert("Now you can consume content : " + namecontent);
                })
                .catch(function (err) {
                    console.log(err);
                    displayErrorInForm("namecontent", "Error, are you sure this content exists?");
                });
        });

        $("#buttontogetcontent").click(function () {
            let namecontent = $("#namecontentconsume").val();
            let namebytes = web3.utils.asciiToHex(namecontent);
            CatalogSmartContract.methods.getAddressContent(namebytes)
                .call()
                .then(function (address) {
                    console.log(address);
                    let ContentManagementContract = new web3.eth.Contract(abiContent, address);
                    return ContentManagementContract.methods.retriveContentPremium()
                        .send({ value: 0, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount });
                })
                .then(function (transaction) {
                    alert(namecontent + " consumed.");
                    console.log("Content obtained.");
                })
                .catch(function (err) {
                    console.log(err);
                });
        });
    }
    else {
        //Button action for Standard customer
        console.log("Setting up standard ui");
        $("#loginpanel").append("<div id='cardbobystandard' class='card-body text-success'> <div class='card-header' style='background-color:#C8E6C9'> <h5 class='card-title'>Logged as Standard Account</h5> </div> </div> <div class='card-body'> <button id='buttonforpremium' type='button' class='btn btn-outline-success'>Get Premium Account (1 ETH) </button> <\div>");
        $("#buttonforpremium").click(function () {
            if (window.confirm("Buying premium costs 1 ether. Do you agree?")) {
                CatalogSmartContract.methods.BuyPremium().send({ from: web3.eth.defaultAccount, value: web3.utils.toWei("1", "ether") })
                    .then(function (transaction) {
                        alert("Payed 1 Ether! Transaction hash = " + transaction.transactionHash);
                        console.log(transaction);
                        location.reload();
                    })
                    .catch(function (err) {
                        console.log(err);
                        $("#loginpanel").append("<div style='color: #ff0000' >Error, are you sure you have the rigth ammount of Ether?</div>");
                    });
            }
        });

        $("#buttontogetaccesscontent").click(function () {
            let namecontent = $("#namecontent").val();
            let namecontentbytes = web3.utils.asciiToHex(namecontent);
            CatalogSmartContract.methods.getPriceContent(namecontentbytes)
                .call()
                .then(function (price) {
                    if (window.confirm("Buying this content costs " + web3.utils.fromWei(price, 'ether') + " ether. Do you agree?")) {
                        CatalogSmartContract.methods.GetContent(namecontentbytes)
                            .send({ value: price, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount })
                            .then(function (transaction) {
                                console.log(transaction);
                                console.log("obtained access");
                                alert("Payed " + web3.utils.fromWei(price, 'ether') + " Ether! Transaction hash = " + transaction.transactionHash);
                            });
                    }
                })
                .catch(function (err) {
                    console.log(err);
                    displayErrorInForm("namecontent", "Error, are you sure this content exists or you have the rigth ammount of Ether?");
                });
        });

        $("#buttontogetcontent").click(function () {
            let name = $("#namecontentconsume").val();
            let namebytes = web3.utils.asciiToHex(name);
            CatalogSmartContract.methods.getAddressContent(namebytes)
                .call()
                .then(function (address) {
                    let ContentManagementContract = new web3.eth.Contract(abiContent, address);
                    console.log(ContentManagementContract);
                    console.log("address of the content : ");
                    console.log(address);
                    //maybe event
                    //alert("Now you can leave a feedback for this content. At the bottom of this page you can find the right form to do it.");
                    return ContentManagementContract.methods.retriveContentStandard()
                        .send({ value: 0, gas: 1500000, gasPrice: '2000000000', from: web3.eth.defaultAccount });
                })
                .then(function (transaction) {
                    alert(name + " consumed.");
                    alert("Now you can leave a feedback for this content. At the bottom of this page you can find the right form to do it.");
                    console.log("Content obtained.");
                })
                .catch(function (err) {
                    console.log(err);
                    displayErrorInForm("namecontentconsume", "Error, are you sure you have rigth to access this content?");
                });
        });
    }
}

function setUpEvents() {
    /*
    Event List 
    event ContentAccessObtainedStandard(bytes32 name, address addr); ???
    event ContentAccessObtainedPremium(bytes32 name, address addr); ???
    */
    //Setting up events
    CatalogSmartContract.events.ContentAccessGifted()
        .on('data', function (event) {
            if (data.returnValues.to.localeCompare(web3.eth.defaultAccount) == 0) {
                alert(data.returnValues.from + " gifted you content: " + data.returnValues.name + "!");
            }
        })
        .on('error', console.error);

    CatalogSmartContract.events.PremiumGifted()
        .on('data', function (event) {
            if (event.returnValues.to.localeCompare(web3.eth.defaultAccount) == 0) {
                alert(event.returnValues.from + " gifted you a Premium account!");
                location.reload();
            }
        })
        .on('error', console.error);

}

function displayErrorInForm(idElement, stringToAdd) {
    if ($("#" + idElement).next().is(".invalid-feedback")) {
        $("#" + idElement).next().remove();
    }
    let newid = Math.floor(Math.random() * 100);
    $("#" + idElement).attr("class", "form-control is-invalid");
    $("#" + idElement).after("<div  id='" + newid + "' class='invalid-feedback'>" + stringToAdd + "</div>");
    setTimeout(function () {
        if ($('#' + newid + '').length > 0) {
            $('#' + newid + '').remove();
        }
    }, 4000);
}

function displayErrorAfterButton(idElement, stringToAdd) {
    if ($("#" + idElement).children().last().attr("class") == undefined) {
        $("#" + idElement).children().last().remove();
    }
    let newid = Math.floor(Math.random() * 100);
    $("#" + idElement).append("<div id='" + newid + "' style='color: #ff0000' >" + stringToAdd + "</div> ");
    setTimeout(function () {
        if ($('#' + newid + '').length > 0) {
            $('#' + newid + '').remove();
        }
    }, 4000);
}