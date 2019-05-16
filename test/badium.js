const Badium = artifacts.require('Badium')

contract('Badium', () => {
  let accounts = null
  let instance = null

  beforeEach(async () => {
    accounts = await web3.eth.getAccounts()
    instance = await Badium.new()
  })

  afterEach(async () => {
    accounts = null
    instance = null
  })

  it('should load accounts successfully', async () => {
    assert.ok(accounts)
  })

  it('should create a contract instance successfully', async () => {
    assert.ok(instance)
  })
})
