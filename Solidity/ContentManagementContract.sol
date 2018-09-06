pragma solidity ^0.4.24;

import "./CatalogSmartContract.sol";

contract ContentManagementContract{
    uint public viewsToPayments = 3;
    bytes32 public genre;
    bytes32 public name;
    address public authorAddress;
    bytes32 public authorName;
    address public catalog;
    uint internal blockGenerated;
    uint public price;
    uint public views=0;
    uint internal feedBack1=0;
    uint internal feedBack2=0;
    uint internal feedBack3=0;
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
            AuthorizedStandardCustomers[msg.sender].canLeaveAFeedBack == true,
            "You are not authorized to leave a feedback"
        );
        _;
    }
    
    modifier authorizedLeaveAFeedBackPremium() {
        require(
            AuthorizedPremiumCustomers[msg.sender].canLeaveAFeedBack == true,
            "You are not authorized to leave a feedback"
        );
        _;
    }
    
    function setEnabledStandard(address addr) external onlyCatalog() {
        AuthorizedStandardCustomers[addr] = StandardRight(true,false);
    }
    
    function setEnabledPremium(address addr, uint lastblockvalid_) external onlyCatalog {
        AuthorizedPremiumCustomers[addr] = PremiumRight(true, lastblockvalid_,false);
    }
    
    function retriveContentStandard() external onlyAuthorizedStandard {
        views++;
        AuthorizedStandardCustomers[msg.sender].isAuthorized = false;
        AuthorizedStandardCustomers[msg.sender].canLeaveAFeedBack = true;
        emit notifyFeedBackAvailable(msg.sender, name);
        if(views % viewsToPayments == 0){
            uint startGas = gasleft();
            //trigger payments
            CatalogSmartContract catalogcasted = CatalogSmartContract(catalog);
            catalogcasted.PayArtist(startGas);
        }
        
    }
    
    function retriveContentPremium() external onlyAuthorizedPremium {
        AuthorizedPremiumCustomers[msg.sender].isAuthorized = false;
        AuthorizedPremiumCustomers[msg.sender].canLeaveAFeedBack = true;
        emit  notifyFeedBackAvailable(msg.sender, name);
    }
    
    function LeaveFeedBackStandard(uint8 feedBack1_, uint8 feedBack2_, uint8 feedBack3_) external authorizedLeaveAFeedBackStandard{
        require(feedBack1_ >= 1 && feedBack1_ <= 5 && feedBack2_ >= 1 && feedBack2_ <= 5 && feedBack3_ >= 1 && feedBack2_<= 5);
        feedBack1 += feedBack1_;
        feedBack2 += feedBack2_;
        feedBack3 += feedBack3_;
        numfeedback++;
        AuthorizedStandardCustomers[msg.sender].canLeaveAFeedBack = false;
    }
    
    function LeaveFeedBackPremium(uint8 feedBack1_, uint8 feedBack2_, uint8 feedBack3_) external authorizedLeaveAFeedBackPremium{
        require(feedBack1_ >= 1 && feedBack1_ <= 5 && feedBack2_ >= 1 && feedBack2_ <= 5 && feedBack3_ >= 1 && feedBack2_ <= 5);
        feedBack1 += feedBack1_;
        feedBack2 += feedBack2_;
        feedBack3 += feedBack3_;
        numfeedback++;
        AuthorizedPremiumCustomers[msg.sender].canLeaveAFeedBack = false;
    }
    
    function getMean() external view returns (uint result){
        if(numfeedback == 0){
            result = 0;
        }
        else{
            result = (((feedBack3+feedBack2+feedBack1)*meanMultiplier)/3)/numfeedback;
        }
    }
    
    function getMeanFeedBackCategory(uint8 feedbackCategory) external view returns (uint result){
        if(numfeedback == 0){
            result = 0;
        }
        else{
            if(feedbackCategory == 1){
            result = ((feedBack1)*meanMultiplier)/numfeedback;
            }
            else{
                if(feedbackCategory == 2){
                   result = ((feedBack2)*meanMultiplier)/numfeedback; 
                }
                else{
                    if(feedbackCategory == 3){
                        result = ((feedBack2)*meanMultiplier)/numfeedback; 
                    }
                }
            }
        }
    }
    
    
    function close() public onlyCatalog {
        selfdestruct(catalog);
    }
}
