const Badium = artifacts.require('Badium')

contract('Badium', () => {
  const UINT256_MAX = web3.utils.toBN(web3.utils.toTwosComplement(-1))

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

  it('should be called Badium', async () => {
    let name = await instance.name()
    assert.strictEqual(name, 'Badium')
  })

  it('should have symbol BAD', async () => {
    let name = await instance.symbol()
    assert.strictEqual(name, 'BAD')
  })

  it('should have an initial total supply of 10M', async () => {
    let totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 10000000)
  })

  it('should support querying an address\' balance', async () => {
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    assert.strictEqual(balance0.toNumber(), 10000000)
    assert.strictEqual(balance1.toNumber(), 0)
  })

  it('should allow the contract owner to approve token receivers', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
  })

  it('should allow the contract owner to remove approval from token receivers', async () => {
    assert.ok(await instance.removeReceiver(accounts[1]))
  })

  it('should allow token holders to transfer their tokens to approved receivers', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
    assert.ok(await instance.transfer(accounts[1], 1))
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    assert.strictEqual(balance0.toNumber(), 9999999)
    assert.strictEqual(balance1.toNumber(), 1)
  })

  it('should prevent token holders from transfering to non-approved receivers (1)', async () => {
    await assertThrows(
      async () => {
        await instance.transfer(accounts[1], 1)
      },
      'Badium: Invalid receiver.'
    )
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    assert.strictEqual(balance0.toNumber(), 10000000)
    assert.strictEqual(balance1.toNumber(), 0)
  })

  it('should prevent token holders from transfering to non-approved receivers (2)', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
    assert.ok(await instance.removeReceiver(accounts[1]))
    await assertThrows(
      async () => {
        await instance.transfer(accounts[1], 1)
      },
      'Badium: Invalid receiver.'
    )
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    assert.strictEqual(balance0.toNumber(), 10000000)
    assert.strictEqual(balance1.toNumber(), 0)
  })

  it('should support arbitrary transfers by the contract owner', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
    assert.ok(await instance.addReceiver(accounts[2]))
    assert.ok(await instance.transfer(accounts[1], 2))
    assert.ok(await instance.transferFrom(accounts[1], accounts[2], 1))
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    let balance2 = await instance.balanceOf(accounts[2])
    assert.strictEqual(balance0.toNumber(), 9999998)
    assert.strictEqual(balance1.toNumber(), 1)
    assert.strictEqual(balance2.toNumber(), 1)
  })

  it('should fail if trying to transfer more than the available funds', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
    await assertThrows(
      async () => {
        await instance.transfer(accounts[1], 10000001)
      },
      'Badium: Insufficient balance.'
    )
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    assert.strictEqual(balance0.toNumber(), 10000000)
    assert.strictEqual(balance1.toNumber(), 0)
  })

  it('should allow token holders to set an allowance to a third-party', async () => {
    assert.ok(await instance.approve(accounts[2], 1, { from: accounts[1] }))
  })

  it('should support querying a given third-party\'s allowance', async () => {
    let allowance = await instance.allowance(accounts[0], accounts[1])
    assert.strictEqual(allowance.toNumber(), 0)
  })

  it('should allow third-parties to do a transfer on behalf of a token holder', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
    assert.ok(await instance.addReceiver(accounts[2]))
    assert.ok(await instance.transfer(accounts[1], 2))
    assert.ok(await instance.approve(accounts[2], 1, { from: accounts[1] }))
    assert.ok(await instance.transferFrom(accounts[1], accounts[2], 1, { from: accounts[2] }))
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    let balance2 = await instance.balanceOf(accounts[2])
    assert.strictEqual(balance0.toNumber(), 9999998)
    assert.strictEqual(balance1.toNumber(), 1)
    assert.strictEqual(balance2.toNumber(), 1)
  })

  it('should prevent third-parties from spending more than their allowance', async () => {
    assert.ok(await instance.addReceiver(accounts[1]))
    assert.ok(await instance.approve(accounts[1], 2))
    await assertThrows(
      async () => {
        await instance.transferFrom(accounts[0], accounts[1], 3, { from: accounts[1] })
      },
      'Badium: Insufficient allowance.'
    )
    assert.ok(await instance.transferFrom(accounts[0], accounts[1], 2, { from: accounts[1] }))
    await assertThrows(
      async () => {
        await instance.transferFrom(accounts[0], accounts[1], 1, { from: accounts[1] })
      },
      'Badium: Insufficient allowance.'
    )
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    assert.strictEqual(balance0.toNumber(), 9999998)
    assert.strictEqual(balance1.toNumber(), 2)
  })

  it('should support buying tokens at a cost of 0.01 ETH per BAD', async () => {
    assert.ok(await instance.buy(1, { from: accounts[1], value: web3.utils.toWei('0.01') }))
    assert.ok(await instance.buy(10, { from: accounts[2], value: web3.utils.toWei('0.1') }))
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    let balance2 = await instance.balanceOf(accounts[2])
    assert.strictEqual(balance0.toNumber(), 9999989)
    assert.strictEqual(balance1.toNumber(), 1)
    assert.strictEqual(balance2.toNumber(), 10)
    let balance3 = await web3.eth.getBalance(instance.address)
    assert.strictEqual(web3.utils.fromWei(balance3), '0.11')
  })

  it('should support burning all tokens by the contract owner (1)', async () => {
    assert.ok(await instance.buy(1, { from: accounts[1], value: web3.utils.toWei('0.01') }))
    assert.ok(await instance.buy(1, { from: accounts[2], value: web3.utils.toWei('0.01') }))
    assert.ok(await instance.addReceiver(accounts[3]))
    assert.ok(await instance.addReceiver(accounts[4]))
    assert.ok(await instance.transferFrom(accounts[0], accounts[3], 1))
    assert.ok(await instance.transferFrom(accounts[0], accounts[4], 1))
    let totalSupply = await instance.totalSupply()
    let balance0 = await instance.balanceOf(accounts[0])
    let balance1 = await instance.balanceOf(accounts[1])
    let balance2 = await instance.balanceOf(accounts[2])
    let balance3 = await instance.balanceOf(accounts[3])
    let balance4 = await instance.balanceOf(accounts[4])
    assert.strictEqual(totalSupply.toNumber(), 10000000)
    assert.strictEqual(balance0.toNumber(), 9999996)
    assert.strictEqual(balance1.toNumber(), 1)
    assert.strictEqual(balance2.toNumber(), 1)
    assert.strictEqual(balance3.toNumber(), 1)
    assert.strictEqual(balance4.toNumber(), 1)
    assert.ok(await instance.burn())
    totalSupply = await instance.totalSupply()
    balance0 = await instance.balanceOf(accounts[0])
    balance1 = await instance.balanceOf(accounts[1])
    balance2 = await instance.balanceOf(accounts[2])
    balance3 = await instance.balanceOf(accounts[3])
    balance4 = await instance.balanceOf(accounts[4])
    assert.strictEqual(totalSupply.toNumber(), 0)
    assert.strictEqual(balance0.toNumber(), 0)
    assert.strictEqual(balance1.toNumber(), 0)
    assert.strictEqual(balance2.toNumber(), 0)
    assert.strictEqual(balance3.toNumber(), 0)
    assert.strictEqual(balance4.toNumber(), 0)
  })

  it('should support burning all tokens by the contract owner (2)', async () => {
    let totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 10000000)
    assert.ok(await instance.burn())
    totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 0)
    await instance.mint(100)
    totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 100)
    assert.ok(await instance.burn())
    totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 0)
  })

  it('should support minting an arbitrary amount of tokens', async () => {
    let totalSupply = await instance.totalSupply()
    let balance = await instance.balanceOf(accounts[0])
    assert.strictEqual(totalSupply.toNumber(), 10000000)
    assert.strictEqual(balance.toNumber(), 10000000)
    assert.ok(await instance.mint(1))
    assert.ok(await instance.mint(10))
    assert.ok(await instance.mint(100))
    assert.ok(await instance.mint(1000))
    assert.ok(await instance.mint(10000))
    totalSupply = await instance.totalSupply()
    balance = await instance.balanceOf(accounts[0])
    assert.strictEqual(totalSupply.toNumber(), 10011111)
    assert.strictEqual(balance.toNumber(), 10011111)
  })

  it('should fail if trying to mint past the total supply limit', async () => {
    let totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 10000000)
    await assertThrows(
      async () => {
        await instance.mint(UINT256_MAX)
      },
      'Badium: Total supply limit exceeded.'
    )
    totalSupply = await instance.totalSupply()
    assert.strictEqual(totalSupply.toNumber(), 10000000)
  })

  it('should allow the contract owner to withdraw Ether collected from purchases', async () => {
    assert.ok(await instance.buy(100, { from: accounts[1], value: web3.utils.toWei('1') }))
    assert.ok(await instance.buy(100, { from: accounts[2], value: web3.utils.toWei('1') }))
    let balance1 = await web3.eth.getBalance(accounts[0])
    let balance2 = await web3.eth.getBalance(instance.address)
    assert.ok(await instance.withdraw(balance2))
    let balance3 = await web3.eth.getBalance(accounts[0])
    let balance4 = await web3.eth.getBalance(instance.address)
    let difference = Number(
      web3.utils.fromWei(
        web3.utils.toBN(balance1).add(web3.utils.toBN(balance2)).sub(web3.utils.toBN(balance3))
      )
    )
    assert.ok(difference < 1e-2)
    assert.strictEqual(web3.utils.fromWei(balance4), '0')
  })

  it('should fail if a user tries to access owner-only features', async () => {
    await assertThrows(
      async () => {
        await instance.withdraw(1, { from: accounts[1] })
      },
      'Badium: Unauthorized.'
    )
    await assertThrows(
      async () => {
        await instance.burn({ from: accounts[1] })
      },
      'Badium: Unauthorized.'
    )
    await assertThrows(
      async () => {
        await instance.mint(1, { from: accounts[1] })
      },
      'Badium: Unauthorized.'
    )
    await assertThrows(
      async () => {
        await instance.addReceiver(accounts[0], { from: accounts[1] })
      },
      'Badium: Unauthorized.'
    )
    await assertThrows(
      async () => {
        await instance.removeReceiver(accounts[0], { from: accounts[1] })
      },
      'Badium: Unauthorized.'
    )
  })
})

async function assertThrows (asyncFunction, errorMessage) {
  try {
    await asyncFunction()
  } catch (err) {
    assert.ok(err.message.indexOf(errorMessage) !== -1)
    return
  }
  assert.ok(false, 'Expected error to be thrown.')
}
