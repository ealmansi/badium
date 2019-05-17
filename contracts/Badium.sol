pragma solidity >=0.4.21 <0.6.0;

contract Badium {
  /**
   *
   * Constants.
   *
   */

  uint256 constant UINT256_MAX = ~uint256(0);
  string constant TOKEN_NAME = "Badium";
  string constant TOKEN_SYMBOL = "BAD";
  uint256 constant INITIAL_SUPPLY = 10000000;
  uint256 constant EXCHANGE_RATE = 0.01 ether;

  /**
   *
   * Events.
   *
   */

  event Transfer (address indexed from, address indexed to, uint256 amount);
  event Approval (address indexed holder, address indexed spender, uint256 amount);

  /**
   *
   * Internal state.
   *
   */

  address payable private _owner;

  string private _name;

  string private _symbol;

  uint256 private _burnCount;

  mapping (
    uint256 => uint256
  ) private _totalSupply;

  mapping (
    uint256 => mapping (
      address => uint256
    )
  ) private _balances;

  mapping (
    uint256 => mapping (
      address => mapping (
        address => uint256
      )
    )
  ) private _allowances;

  mapping (
    address => bool
  ) private _receivers;

  /**
   *
   * Modifiers.
   *
   */

  /**
   *
   */
  modifier onlyOwner() {
    address _sender = msg.sender;
    require(_sender == _owner, "Badium: Unauthorized.");
    _;
  }

  /**
   *
   * Implementation.
   *
   */

  /**
   *
   */
  constructor () public {
    _owner = msg.sender;
    _name = TOKEN_NAME;
    _symbol = TOKEN_SYMBOL;
    _totalSupply[_burnCount] = INITIAL_SUPPLY;
    _balances[_burnCount][_owner] = _totalSupply[_burnCount];
  }

  /**
   *
   * Optional ERC20 features.
   *
   */

  /**
   * @return The token's name.
   */
  function name () public view returns (string memory) {
    return _name;
  }

  /**
   * @return The token's symbol.
   */
  function symbol () public view returns (string memory) {
    return _symbol;
  }

  /**
   *
   * Mandatory ERC20 features.
   *
   */

  /**
   * @return The token's current total supply.
   */
  function totalSupply () public view returns (uint256) {
    return _totalSupply[_burnCount];
  }

  /**
   * @param holder Token holder's address.
   * @return The balance of the given address.
   */
  function balanceOf (address holder) public view returns (uint256) {
    return _balances[_burnCount][holder];
  }

  /**
   * @dev Transfers the given amount of BAD tokens belonging to the sender to a pre-approved
   * receiver ('to').
   * @param to Receiver's address.
   * @param amount Amount in BAD to transfer.
   * @return True on success, else false.
   */
  function transfer (address to, uint256 amount) public returns (bool) {
    require(_receivers[to], "Badium: Invalid receiver.");

    address _sender = msg.sender;
    return transferFrom(_sender, to, amount);
  }

  /**
   * @dev Transfers the given amount of BAD tokens belonging to the given token holder ('from') to
   * a pre-approved receiver ('to').
   * @param from Token holder's address.
   * @param to Receiver's address.
   * @param amount Amount in BAD to transfer.
   * @return True on success, else false.
   */
  function transferFrom (address from, address to, uint256 amount) public returns (bool) {
    require(_receivers[to], "Badium: Invalid receiver.");

    address _sender = msg.sender;
    if (_sender != from && _sender != _owner) {
      require(amount <= _allowances[_burnCount][from][_sender], "Badium: Insufficient allowance.");
      _allowances[_burnCount][from][_sender] -= amount;
    }

    require(amount <= _balances[_burnCount][from], "Badium: Insufficient balance.");
    _balances[_burnCount][from] -= amount;

    require(amount <= UINT256_MAX - _balances[_burnCount][to], "Badium: Balance limit exceeded.");
    _balances[_burnCount][to] += amount;

    emit Transfer(from, to, amount);
    return true;
  }

  /**
   * @dev Approves an allowance for the given spender, allowing this address to move up to the given
   * amount of BAD tokens belonging to the sender.
   * @param spender Address of the spender.
   * @param amount Amount in BAD which the spender will be able to transfer from sender's tokens.
   * @return True on success, else false.
   */
  function approve (address spender, uint256 amount) public returns (bool) {
    address _sender = msg.sender;
    _allowances[_burnCount][_sender][spender] = amount;

    emit Approval(_sender, spender, amount);
    return true;
  }

  /**
   * @dev Retrieves the allowance approved by the given holder for the given spender.
   * @param holder Address of the token holder.
   * @param spender Address of the spender.
   * @return The maximum amount that the spender is approved to transfer from the holder's tokens.
   */
  function allowance (address holder, address spender) public view returns (uint256) {
    return _allowances[_burnCount][holder][spender];
  }

  /**
   *
   * Custom Badium features.
   *
   */

  /**
   * @dev Purchases the given amount of BAD tokens by exchanging them for the Ether received in the
   * incoming transaction at a rate of 0.01 ETH per BAD token. The purchased tokens will be assigned
   * to the sender's address.
   * @param amount The amount of BAD tokens to buy.
   * @return True on success, else false.
   */
  function buy (uint256 amount) public payable returns (bool) {
    uint256 value = msg.value;
    require(
      value > 0 &&
      value % EXCHANGE_RATE == 0 &&
      value / EXCHANGE_RATE == amount,
      "Badium: Invalid transaction value."
    );

    require(amount <= _balances[_burnCount][_owner], "Badium: Insufficient available supply.");
    _balances[_burnCount][_owner] -= amount;

    address _sender = msg.sender;
    require(
      amount <= UINT256_MAX - _balances[_burnCount][_sender],
      "Badium: Balance limit exceeded."
    );
    _balances[_burnCount][_sender] += amount;

    return true;
  }

  /**
   * @dev Withdraws the specified value in Wei by transfering funds to the owners' address.
   * @param value The amount of Wei to withdraw.
   * @return True on success, else false.
   */
  function withdraw (uint256 value) public onlyOwner returns (bool) {
    uint256 _balance = address(this).balance;
    require(value <= _balance, "Badium: Insufficient balance.");
    _owner.transfer(value);

    return true;
  }

  /**
   * @dev Erases all issued tokens from existence.
   * @return True on success, else false.
   */
  function burn () public onlyOwner returns (bool) {
    require(1 <= UINT256_MAX - _burnCount, "Badium: Burn count limit exceeded.");
    _burnCount += 1;

    return true;
  }

  /**
   * @dev Increases the total supply by the specified amount of tokens. The created tokens are
   * assigned to the owner's account.
   * @param amount The amount of tokens to be minted.
   * @return True on success, else false.
   */
  function mint (uint256 amount) public onlyOwner returns (bool) {
    require(
      amount <= UINT256_MAX - _totalSupply[_burnCount],
      "Badium: Total supply limit exceeded."
    );
    _totalSupply[_burnCount] += amount;

    require(
      amount <= UINT256_MAX - _balances[_burnCount][_owner],
      "Badium: Balance limit exceeded."
    );
    _balances[_burnCount][_owner] += amount;

    return true;
  }

  /**
   * @dev Adds the given address to the list of approved receivers.
   * @param receiver The receiver's address.
   * @return True on success, else false.
   */
  function addReceiver (address receiver) public onlyOwner returns (bool) {
    _receivers[receiver] = true;

    return true;
  }

  /**
   * @dev Removes the given address from the list of approved receivers.
   * @param receiver The receiver's address.
   * @return True on success, else false.
   */
  function removeReceiver (address receiver) public onlyOwner returns (bool) {
    _receivers[receiver] = false;

    return true;
  }
}
