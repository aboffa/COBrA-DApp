pragma solidity ^0.4.24;


contract ContentManagementContract{
    bytes32 public genre;
    bytes32 public name;
    bytes32 public data;
    address public authorAddress;
    bytes32 public authorName;
    address public catalog;
    uint blockGenerated;
    uint public price;
    uint views;
    
    mapping (address => uint) public AuthorizedPremiumCustomers;
    mapping (address => bool) public AuthorizedStandardCustomers;
    
    event canLeaveAFeedBack(string s);

    constructor (bytes32 name_, bytes32 genre_, bytes32 data_, uint price_ , bytes32 authorName_, address catalog_) public {
        catalog = catalog_;
        name = name_;
        genre = genre_;
        authorAddress = msg.sender;
        data = data_;
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
            (AuthorizedPremiumCustomers[msg.sender] > block.number),
            "Only customer that payed can access to this Content."
        );
        _;
    }
    
    function setEnabledStandard(address addr) public onlyCatalog {
        AuthorizedStandardCustomers[addr] = true;
    }
    
    function setEnabledPremium(address addr, uint lastblockvalid) public onlyCatalog {
        AuthorizedPremiumCustomers[addr] = lastblockvalid;
    }
    
    function retriveContentStandard() public onlyAuthorizedStandard {
        views++;
        AuthorizedStandardCustomers[msg.sender] = false;
        emit canLeaveAFeedBack("You can leave a feedback");
        
    }
    
    function retriveContentPremium() public onlyAuthorizedPremium {
        emit canLeaveAFeedBack("You can leave a feedback");
        
    }
}
