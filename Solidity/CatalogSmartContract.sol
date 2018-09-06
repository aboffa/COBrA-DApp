pragma solidity ^0.4.24;

import "./ContentManagementContract.sol";

contract CatalogSmartContract {
    uint private WeiForPremium = 1000000000000000000;
    uint private BlockForPremium = 10;
    address private owner;
    mapping (address => uint) internal premiumCustomers;
    mapping (bytes32 => address) internal mapNameAddress;
    address[] internal contentManagers;

    // Used to log
    event ContentAccessObtainedStandard(bytes32 name, address addr);
    event ContentAccessObtainedPremium(bytes32 name, address addr);
    
    // Used to notify users about important event
    event ContentAccessGifted(address from, bytes32 name, address to);
    event PremiumGifted(address from, address to);
    event NewContentEvent( bytes32 genre, bytes32 autor);
    
    modifier onlyOwner {
        require(
            msg.sender == owner,
            "Only owner can call this function."
        );
        _;
    }

    modifier isStillPremium {
        require(
            isPremium(msg.sender),
            "Your premium account is expired."
        );
        _;
    }

    constructor () public {
        owner = msg.sender;
    }

    function BuyPremium() public payable  {
        require (msg.value >= WeiForPremium, "You have to pay the right amount!");
        premiumCustomers[msg.sender] = block.number + BlockForPremium;
    }
    
    function NewContent(address cmc) public {
        ContentManagementContract newcmc = ContentManagementContract(cmc);
        bytes32 name = newcmc.name();
        for (uint i = 0; i < contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            require (cmccasted.name() != name, "We don't want two contents with the same name");
            if(cmccasted.authorName() == newcmc.authorName()){
                require(cmccasted.authorAddress() == newcmc.authorAddress(), "There is an other author with this name");
            }
        }
        mapNameAddress[name] = cmc;
        contentManagers.push(cmc);
        emit NewContentEvent(newcmc.genre(), newcmc.authorName());
    }
    
    function GetContent(bytes32 name_) payable public {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price, "You have to pay the right amount!");
        cmccasted.setEnabledStandard(msg.sender);
        emit ContentAccessObtainedStandard(name_, msg.sender);
    }
    
    function GetContentPremium(bytes32 name_) public isStillPremium {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        cmccasted.setEnabledPremium(msg.sender, premiumCustomers[msg.sender]);
        emit ContentAccessObtainedPremium(name_, msg.sender);
    }
    
    function getPriceContent(bytes32 name_) view public returns (uint price) {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        price = cmccasted.price();
    }
    
    function getAddressContent(bytes32 name_) view public returns (address cm){
        cm = fromNametoContent(name_);
    
    }
    function GiftPremium(address a)  payable public {
        require(msg.value >= WeiForPremium, "You have to pay the right amount!");
        premiumCustomers[a] = block.number + BlockForPremium;
        emit PremiumGifted(msg.sender, a);
    }
    
    function GiftContent(bytes32 name_, address a)  payable public {
        address cm = fromNametoContent(name_);
        ContentManagementContract cmccasted = ContentManagementContract(cm);
        uint price = cmccasted.price();
        require(msg.value >= price,  "You have to pay the right amount!");
        cmccasted.setEnabledStandard(a);
        emit ContentAccessGifted(msg.sender, name_, a);
    }
    
    function isPremium(address a)  public view returns (bool ok) {
        ok = (premiumCustomers[a] > block.number);
    }

    function fromNametoContent(bytes32 name_) view private returns (address a){
        a = mapNameAddress[name_];
        require(a!=address(0), "This content doesn't exit");
    }

    function PayArtist(uint startgas) public {
        ContentManagementContract cmccasted = ContentManagementContract(msg.sender);
        assert((cmccasted.views() % cmccasted.viewsToPayments()) == 0);
        ContentManagementContract cmccastedmostpopular = ContentManagementContract(getAddressContent(GetMostRathed()));
        uint feedbackmostpapular = cmccastedmostpopular.getMean();
        if(feedbackmostpapular != 0 ){
            uint feedbackcontenttopay = cmccasted.getMean();
            if(feedbackcontenttopay != 0){
                uint ratio = (feedbackcontenttopay * 1000)/feedbackmostpapular;
                uint totranfer = ((cmccasted.price()*cmccastedmostpopular.viewsToPayments())/1000)*ratio;
                cmccasted.authorAddress().transfer((totranfer));
            }
        }
        uint gasUsed = startgas - gasleft();
        // 7910 cost this piece of code
        uint toRefound = ((gasUsed+7910)*tx.gasprice);
        if(address(this).balance > toRefound ){
            tx.origin.transfer(toRefound);
        }
    }

    //Statistics
    function GetStatistics() external view returns (uint[] viewsarray ){
        viewsarray = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            viewsarray[i] = cmccasted.views();
        }
    }
    
    function GetContentList() public view returns (bytes32[] result) {
        result = new bytes32[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.name();
        }
    }
    
    
    function GetNewContentList(uint num) external view returns (bytes32[] result){
        if(num >= contentManagers.length){
            result = GetContentList();
        }
        else{
            result = new bytes32[](num);
            for(uint i = 0; i < num; i++){
                ContentManagementContract cmccasted = ContentManagementContract(contentManagers[contentManagers.length - 1 - num]);
                result[i] = cmccasted.name();
            }
        }
    }
    
    function GetLatestByGenre(bytes32 genre_) external view returns (bytes32 result){
        for (uint i = contentManagers.length; i>=0; i--){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            if(cmccasted.genre() == genre_ ){
                result = cmccasted.name();
                break;
            }
        }        
    }
    
    function GetMostPopularByGenre(bytes32 genre_) external view returns (bytes32 result){
        uint viewsmax;
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            if(cmccasted.genre() == genre_ && viewsmax <= cmccasted.views() ){
                result = cmccasted.name();
                viewsmax = cmccasted.views();
            }
        }    
    }

    function GetLatestByAuthor(bytes32 author) external view returns (bytes32 result){
        for (uint i = contentManagers.length; i>=0; i--){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            if(cmccasted.authorName() == author ){
                result = cmccasted.name();
                break;
            }
        }   
    }    
    
    function GetMostPopularByAuthor(bytes32 author) external view returns (bytes32 result ){
        uint viewsmax;
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            if(cmccasted.genre() == author && viewsmax <= cmccasted.views() ){
                result = cmccasted.name();
                viewsmax = cmccasted.views();
            }
        }  
    }
    function GetMostRathed() public view returns (bytes32 result ){
        uint maxmeantmp = 0;
        for (uint k = 0; k<contentManagers.length; k++){
            ContentManagementContract cmccastedk = ContentManagementContract(contentManagers[k]);
            if(cmccastedk.getMean() >= maxmeantmp){
                maxmeantmp = cmccastedk.getMean();
                result = cmccastedk.name();
            }
        }
    } 
        
    function GetMostRathed(uint8 feedbackCategory) external view returns (bytes32 result ){
        uint maxtmpi = 0;
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccastedi = ContentManagementContract(contentManagers[i]);
            if(cmccastedi.getMeanFeedBackCategory(feedbackCategory) >= maxtmpi){
                maxtmpi = cmccastedi.getMeanFeedBackCategory(feedbackCategory);
                result = cmccastedi.name();
            }
        }
    }
    
    function GetMostRathedByGenre(bytes32 genre) external view returns (bytes32 result ){
        uint maxmeantmp = 0;
        for (uint k = 0; k<contentManagers.length; k++){
            ContentManagementContract cmccastedk = ContentManagementContract(contentManagers[k]);
            if(cmccastedk.getMean() >= maxmeantmp && cmccastedk.genre() == genre){
                maxmeantmp = cmccastedk.getMean();
                result = cmccastedk.name();
            }
        }
    }
    
    function GetMostRathedByGenre(bytes32 genre, uint8 feedbackCategory) external view returns (bytes32 result ){
        uint maxtmpi = 0;
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccastedi = ContentManagementContract(contentManagers[i]);
            if(cmccastedi.getMeanFeedBackCategory(feedbackCategory) >= maxtmpi && cmccastedi.genre() == genre ){
                maxtmpi = cmccastedi.getMeanFeedBackCategory(feedbackCategory);
                result = cmccastedi.name();
            }
        }
    }
    
    function GetMostRathedByAuthor(bytes32 author)external view returns (bytes32 result ){
        uint maxmeantmp = 0;
        for (uint k = 0; k<contentManagers.length; k++){
            ContentManagementContract cmccastedk = ContentManagementContract(contentManagers[k]);
            if(cmccastedk.getMean() >= maxmeantmp && cmccastedk.authorName() == author){
                maxmeantmp = cmccastedk.getMean();
                result = cmccastedk.name();
            }
        }
    }
    
    function GetMostRathedByAuthor(bytes32 author, uint8 feedbackCategory) external view returns (bytes32 result ){
        uint maxtmpi = 0;
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccastedi = ContentManagementContract(contentManagers[i]);
            if(cmccastedi.getMeanFeedBackCategory(feedbackCategory) >= maxtmpi && cmccastedi.authorName() == author ){
                maxtmpi = cmccastedi.getMeanFeedBackCategory(feedbackCategory);
                result = cmccastedi.name();
            }
        }      
    }
    
    
    function GetFeedBacks() external view returns (uint[] result) {
        result = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.getMean();
        }
    }
    
    function GetMeanFeedBackCategory(uint8 feedbackCategory) external view returns (uint[] result) {
        result = new uint[](contentManagers.length);
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            result[i] = cmccasted.getMeanFeedBackCategory(feedbackCategory);
        }
    }
    
    function close() public onlyOwner {
        uint sumviews = 0;
        for (uint i = 0; i<contentManagers.length; i++){
            ContentManagementContract cmccasted = ContentManagementContract(contentManagers[i]);
            sumviews += cmccasted.views();
        }
        uint portionPerView = address(this).balance / sumviews;
        for (uint j = 0; j<contentManagers.length; j++){
            ContentManagementContract cmccastedj = ContentManagementContract(contentManagers[j]);
                cmccastedj.authorAddress().transfer(portionPerView * cmccastedj.views());
        }
        for (uint h = 0; h<contentManagers.length; h++){
            ContentManagementContract cmccastedh = ContentManagementContract(contentManagers[h]);
            cmccastedh.close();
        }
        selfdestruct(owner);
    }
    
    function() public payable { }
}
