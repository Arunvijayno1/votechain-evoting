const crypto = require('crypto');

class Block {
  constructor(index, dataHash, previousHash = '0') {
    this.index        = index;
    this.timestamp    = new Date().toISOString();
    this.dataHash     = dataHash;
    this.previousHash = previousHash;
    this.nonce        = 0;
    this.hash         = this.calculateHash();
  }
  calculateHash() {
    return crypto.createHash('sha256')
      .update(`${this.index}${this.timestamp}${this.dataHash}${this.previousHash}${this.nonce}`)
      .digest('hex');
  }
  mineBlock(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) { this.nonce++; this.hash = this.calculateHash(); }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this._genesis()];
    this.difficulty = 2;
  }
  _genesis() {
    const b = new Block(0, '0000000000000000', '0000000000000000');
    b.hash = b.calculateHash();
    return b;
  }
  addVoteBlock(voteHash) {
    const block = new Block(this.chain.length, voteHash, this.chain[this.chain.length-1].hash);
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    return block;
  }
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const cur = this.chain[i], prev = this.chain[i-1];
      if (cur.previousHash !== prev.hash) return false;
    }
    return true;
  }
  getStats() {
    return { totalBlocks: this.chain.length, isValid: this.isChainValid(), latestHash: this.chain[this.chain.length-1].hash, genesisHash: this.chain[0].hash };
  }
}

function hashVoteData({ voterId, candidateId, electionId, timestamp }) {
  return crypto.createHash('sha256').update(`${voterId}:${candidateId}:${electionId}:${timestamp}`).digest('hex');
}

const blockchain = new Blockchain();
module.exports = { blockchain, hashVoteData };
