pragma solidity ^0.4.24;


contract ContentManagementContract{
    //not public maybe internal
    bytes32 public genre;
    bytes32 public name;
    address public authorAddress;
    bytes32 public authorName;
    address public catalog;
    uint blockGenerated;
    uint public price;
    uint public views;
    
    struct PremiumRight{
        bool isAuthorized;
        uint lastblockvalid;
    }
    mapping (address => PremiumRight) public AuthorizedPremiumCustomers;
    mapping (address => bool) public AuthorizedStandardCustomers;
    
    event canLeaveAFeedBack(string s);

    constructor (bytes32 name_, bytes32 genre_, uint price_ , bytes32 authorName_, address catalog_) public {
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
    
    modifier onlyAuthorizedStandard() {
        require(
            AuthorizedStandardCustomers[msg.sender],
            "Only customer that payed can access to this Content."
        );
        _;
    }
    
    modifier onlyAuthorizedPremium() {
        require(
            (AuthorizedPremiumCustomers[msg.sender].isAuthorized && AuthorizedPremiumCustomers[msg.sender].lastblockvalid > block.number),
            "Your premium account is expired."
        );
        _;
    }
    
    function setEnabledStandard(address addr) public onlyCatalog() {
        AuthorizedStandardCustomers[addr] = true;
    }
    
    function setEnabledPremium(address addr, uint lastblockvalid_) public onlyCatalog {
        AuthorizedPremiumCustomers[addr] = PremiumRight(true, lastblockvalid_);
    }
    
    function retriveContentStandard() public onlyAuthorizedStandard {
        views++;
        AuthorizedStandardCustomers[msg.sender] = false;
        emit canLeaveAFeedBack("You can leave a feedback");
        
    }
    
    function retriveContentPremium() public onlyAuthorizedPremium {
        AuthorizedPremiumCustomers[msg.sender].isAuthorized = false;
        emit canLeaveAFeedBack("You can leave a feedback");
    }
    
    function close() public onlyCatalog {
        selfdestruct(catalog);
    }
}
