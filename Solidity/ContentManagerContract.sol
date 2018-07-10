pragma solidity ^0.4.0;


contract ContentManagementContract{
    bytes32 public genre;
    bytes32 public name;
    bytes32 public data;
    address public authorAddress;
    bytes32 public authorName;
    address public catalog;
    uint public price;
    uint views;
    
    mapping (address => bool) public AuthorizedCustomers;
    
    event canLeaveAFeedBack(string s);

    constructor (bytes32 name_, bytes32 genre_, bytes32 data_, uint price_ , bytes32 authorName_, address catalog_) public {
        catalog = catalog_;
        name = name_;
        genre = genre_;
        authorAddress = msg.sender;
        data = data_;
        price = price_;
        authorName = authorName_;
    }
    
    modifier onlyCatalog {
        require(
            msg.sender == catalog,
            "Only catalog can call this function."
        );
        _;
    }
    
    modifier onlyAuthorized {
        require(
            AuthorizedCustomers[msg.sender],
            "Only customer that payed can access to this Content."
        );
        _;
    }
    
    function setEnabled(address addr) public onlyCatalog {
        AuthorizedCustomers[addr] = true;
    }
    
    function retriveContent() public onlyAuthorized {
        views++;
        AuthorizedCustomers[msg.sender] = false;
        emit canLeaveAFeedBack("You can leave a feedback");
        
    }
}
