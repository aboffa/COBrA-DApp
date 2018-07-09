pragma solidity ^0.4.0;


contract ContentManagementContract{
    //better enum
    bytes32 public genre;
    bytes32 public name;
    bytes32 public data;
    address public authorAddress;
    bytes32 public authorName;
    address public catalog;
    //maybe price useless
    uint public price;
    mapping (address => bool) public enabledCustomers;
    
    event canLeaveAFeedBack(string s);

    function stringToBytes32(string memory source) public pure  returns (bytes32 result) {
        //this in javasript
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }
    
        assembly {
            result := mload(add(source, 32))
        }
    }
    
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
    
    function setEnabled(address addr) public onlyCatalog {
        enabledCustomers[addr] = true;
    }
    
    function retriveContent() public returns (bytes32 data_) {
        if (enabledCustomers[msg.sender]){
            enabledCustomers[msg.sender] = false;
            data_ =  data;
        }
    }
}
