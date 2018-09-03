pragma solidity ^0.4.24;

import "./CatalogSmartContract.sol";

contract ContentManagementContract{
    //not public maybe internal
    //no uint 
    uint public viewsToPayments = 3;
    bytes32 public genre;
    bytes32 public name;
    address public authorAddress;
    bytes32 public authorName;
    address public catalog;
    uint public blockGenerated;
    uint public price;
    uint public views;
    uint public feedBack1=0;
    uint public feedBack2=0;
    uint public feedBack3=0;
    //to decrease approximation errors
    uint public meanMultiplier=1000;
    uint public numfeedback=0;
    
    struct StandardRight{
        bool isAuthorized;
        bool canLeaveAFeedBack;
    }
    
    struct PremiumRight{
        bool isAuthorized;
        uint lastblockvalid;
        bool canLeaveAFeedBack;
    }
    mapping (address => PremiumRight) public AuthorizedPremiumCustomers;
    mapping (address => StandardRight) public AuthorizedStandardCustomers;
    
    event notifyFeedBackAvailable(address who, bytes32 name_);

    constructor (bytes32 name_, bytes32 genre_, uint price_,bytes32 authorName_, address catalog_) public {
        catalog = catalog_;
        name = name_;
        genre = genre_;
        authorAddress = msg.sender;
        price = price_;
        authorName = authorName_;
        blockGenerated = block.number;
        views = 0;
    }
    
    modifier onlyCatalog {
        require(
            msg.sender == catalog,
            "Only catalog can call this function."
        );
        _;
    }
    
    modifier onlyAuthorizedStandard {
        require(
            AuthorizedStandardCustomers[msg.sender].isAuthorized,
            "Only customer that payed can access to this Content."
        );
        _;
    }
    
    modifier onlyAuthorizedPremium{
        require(
            (AuthorizedPremiumCustomers[msg.sender].isAuthorized && AuthorizedPremiumCustomers[msg.sender].lastblockvalid > block.number),
            "Your premium account is expired."
        );
        _;
    }
    
    modifier authorizedLeaveAFeedBackStandard() {
        require(
            AuthorizedStandardCustomers[msg.sender].canLeaveAFeedBack == true
        );
        _;
    }
    
    modifier authorizedLeaveAFeedBackPremium() {
        require(
            AuthorizedPremiumCustomers[msg.sender].canLeaveAFeedBack == true
        );
        _;
    }
    
    function setEnabledStandard(address addr) public onlyCatalog() {
        AuthorizedStandardCustomers[addr] = StandardRight(true,false);
    }
    
    function setEnabledPremium(address addr, uint lastblockvalid_) public onlyCatalog {
        AuthorizedPremiumCustomers[addr] = PremiumRight(true, lastblockvalid_,false);
    }
    
    function retriveContentStandard() public onlyAuthorizedStandard {
        views++;
        AuthorizedStandardCustomers[msg.sender].isAuthorized = false;
        AuthorizedStandardCustomers[msg.sender].canLeaveAFeedBack = true;
        emit notifyFeedBackAvailable(msg.sender, name);
        if(views % viewsToPayments == 0){
            uint startGas = gasleft();
            //trigger payments
            CatalogSmartContract catalogcasted = CatalogSmartContract(catalog);
            catalogcasted.PayArtist(startGas, authorAddress, address(this), price, viewsToPayments);
        }
        
    }
    
    function retriveContentPremium() public onlyAuthorizedPremium {
        AuthorizedPremiumCustomers[msg.sender].isAuthorized = false;
        AuthorizedPremiumCustomers[msg.sender].canLeaveAFeedBack = true;
        emit  notifyFeedBackAvailable(msg.sender, name);
    }
    
    //modifiers valid feedback
    function LeaveFeedBackStandard(uint8 feedBack1_, uint8 feedBack2_, uint8 feedBack3_) public authorizedLeaveAFeedBackStandard{
        require(feedBack1_ >= 1 && feedBack1_ <= 5 && feedBack2_ >= 1 && feedBack2_ <= 5 && feedBack3_ >= 1 && feedBack2_<= 5);
        feedBack1 += feedBack1_;
        feedBack2 += feedBack2_;
        feedBack3 += feedBack3_;
        numfeedback++;
        AuthorizedStandardCustomers[msg.sender].canLeaveAFeedBack = false;
    }
    
    function LeaveFeedBackPremium(uint8 feedBack1_, uint8 feedBack2_, uint8 feedBack3_) public authorizedLeaveAFeedBackPremium{
        require(feedBack1_ >= 1 && feedBack1_ <= 5 && feedBack2_ >= 1 && feedBack2_ <= 5 && feedBack3_ >= 1 && feedBack2_ <= 5);
        feedBack1 += feedBack1_;
        feedBack2 += feedBack2_;
        feedBack3 += feedBack3_;
        numfeedback++;
        AuthorizedPremiumCustomers[msg.sender].canLeaveAFeedBack = false;
    }
    
    function getMean() public view returns (uint result){
        if(numfeedback == 0){
            result = 0;
        }
        else{
            result = (((feedBack3+feedBack2+feedBack1)*meanMultiplier)/3)/numfeedback;
        }
    }
    
    function getMeanFeedBack1() public view returns (uint result){
        if(numfeedback == 0){
            result = 0;
        }
        else{
            result = ((feedBack1)*meanMultiplier)/numfeedback;
        }
    }
    
    function getMeanFeedBack2() public view returns (uint result){
        if(numfeedback == 0){
            result = 0;
        }
        else{
            result = ((feedBack2)*meanMultiplier)/numfeedback;
        }
    }
    
    function getMeanFeedBack3() public view returns (uint result){
        if(numfeedback == 0){
            result = 0;
        }
        else{
            result = ((feedBack3)*meanMultiplier)/numfeedback;
        }
    }
    
    function close() public onlyCatalog {
        selfdestruct(catalog);
    }
}
