/*jshint esversion: 6 */
$("#actionspanelcustomer").hide();
$("#actionspanelartist").hide();
$("#actionspanelstatistic").hide();
console.log(Web3);
console.log(Web3.givenProvider || Web3.currentProvider);
var web3 = new Web3(Web3.currentProvider || new Web3.providers.WebsocketProvider('ws://localhost:8545'));

var CatalogSmartContract;
web3.eth.getAccounts()
    .then(function (data) {
        console.log(data);
        web3.eth.defaultAccount = data[0];
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
    var contractFileSelected;
    //Setting up Buttons action

    //Button action for Artist Panel
    $("#inputfile").on('change', function (file) {
        contractFileSelected = $('#inputfile').prop('files')[0];
    });
    $("#buttontopublishcontent").click(function () {
        //parse input
        let name = $("#namecontenttopublish").val();
        let genre = $("#genrecontent").val();
        let artist = $("#artistname").val();
        if (name == "" || genre == "" || artist == "" || contractFileSelected == null) {
            displayErrorAfterButton("publishpanel", "Please insert name, genre, your artist name and select the compliled contract");
        }
        else {
            let namebyte = web3.utils.asciiToHex(name);
            let genrebytes = web3.utils.asciiToHex(genre);
            let priceint = Number(web3.utils.toWei($("#pricecontent").val(), 'ether'));
            let artistnamebyte = web3.utils.asciiToHex(artist);
            console.log(contractFileSelected);
            let fr = new FileReader();
            fr.onload = function (result) {
                let jsonContract = JSON.parse(result.target.result);
                console.log(jsonContract);
                //name of the json file have o be the name of the Contract, in a different file of ContentManager
                let nameContract = contractFileSelected.name.slice(0, -5);
                let nameInJson = nameContract + ".sol:" + nameContract;
                let abi = JSON.parse(jsonContract.contracts[nameInJson].abi);
                let code = '0x' + jsonContract.contracts[nameInJson].bin;
                console.log("Deploying the contract");
                let myContract = new web3.eth.Contract(abi, { gas: 3000000, gasPrice: '2000000000', from: web3.eth.defaultAccount });
                console.log(myContract);
                return myContract
                    .deploy({ data: code, arguments: [namebyte, genrebytes, priceint, artistnamebyte, catalogAddress] })
                    .send()
                    .then(function (newContractInstance) {
                        console.log(newContractInstance);
                        return CatalogSmartContract.methods.NewContent(newContractInstance.options.address)
                            .send({ gas: 3000000, from: web3.eth.defaultAccount });
                    })
                    .then(function () {
                        console.log("Ok");
                        alert("Content " + name + " published!");
                        $("#namecontenttopublish").val("");
                        $("#genrecontent").val("");
                        $("#artistname").val("");
                        $("#pricecontent").val("0.01");
                    })
                    .catch(function (err) {
                        console.log(err);
                        displayErrorAfterButton("publishpanel", "Something goes wrong. Maybe you choose a name of content that already exist, or you choose a author name that already exist ");
                    });
            };
            fr.readAsText(contractFileSelected);
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
        let selectedIndex = $("#feedbacktoget").prop('selectedIndex');
        if (selectedIndex == 0) {
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
        if (selectedIndex >= 1 && selectedIndex <= 3) {
            CatalogSmartContract.methods.GetMeanFeedBackCategory(selectedIndex)
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
    });
    var followingArtists = [];
    var followingGenres = [];
    // Button action for notification
    $("#buttontonotify").click(function () {
        let name = $("#nameauthornotify").val();
        let genre_ = $("#namegenrenotify").val();
        if (name == "" && genre_ == "") {
            displayErrorAfterButton("notifypanel", "Please insert a name of Author o a Genre");
        }
        else {
            if (name != "") {
                alert("Subscribed to content published by " + name);
                followingArtists.push(name);
            }
            if (genre_ != "") {
                alert("Subscribed to content of genre " + genre_);
                followingGenres.push(genre_);
            }
        }
    });

    // Button action for leave a feedback
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
                    alert("Now you can consume content : " + namecontent);
                })
                .catch(function (err) {
                    console.log(err);
                    displayErrorInForm("namecontent", "Error, are you sure this content exists? Are you already premium? Refresh the page to check");
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
//debug 
$("#close").click(function () {
    CatalogSmartContract.methods.close()
        .send({ from: web3.eth.defaultAccount })
        .then(function (result) {
            console.log(result);
        })
        .catch(err => console.log(err));
});

function setUpEvents() {
    //For notification
    //Setting up events
    CatalogSmartContract.events.ContentAccessGifted()
        .on('data', function (event) {
            if (data.returnValues.to.localeCompare(web3.eth.defaultAccount) == 0) {
                alert("NOTIFICATION: " + data.returnValues.from + " gifted you content: " + data.returnValues.name + "!");
            }
        })
        .on('error', console.error);

    CatalogSmartContract.events.PremiumGifted()
        .on('data', function (event) {
            if (event.returnValues.to.localeCompare(web3.eth.defaultAccount) == 0) {
                alert("NOTIFICATION: " + event.returnValues.from + " gifted you a Premium account!");
                location.reload();
            }
        })
        .on('error', console.error);

    CatalogSmartContract.events.NewContentEvent()//{
        //filter: { autor: nameauthor } , <- doesn't work so I did it by myself
        //}
        .on('data', function (event) {
            for (let i = 0; i < followingArtists.length; i++) {
                if (web3.utils.hexToAscii(event.returnValues.autor).localeCompare(followingArtists[i]) == 0) {
                    alert("NOTIFICATION: New content published from " + followingArtists[i]);
                    console.log(event);
                }
            }
        })
        .on('error', console.error);

    CatalogSmartContract.events.NewContentEvent()
        .on('data', function (event) {
            for (let i = 0; i < followingGenres.length; i++) {
                if (web3.utils.hexToAscii(event.returnValues.genre).localeCompare(followingGenres[i]) == 0) {
                    alert("NOTIFICATION: New content published of genre " + followingGenres[i]);
                    console.log(event);
                }
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
    }, 5000);
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
    }, 5000);
}