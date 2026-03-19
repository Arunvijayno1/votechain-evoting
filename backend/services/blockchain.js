const crypto = require('crypto');

/**
 * Blockchain Service
 * 
 * A simple private blockchain that stores vote hashes (NOT full vote data).
 * Each block contains: index, timestamp, dataHash, previousHash, currentHash.
 * 
 * The chain is kept in-memory and can be persisted to MongoDB for production.
 */

class Block {
  constructor(index, dataHash, previousHash = '0') {
    this.index        = index;
    this.timestamp    = new Date().toISOString();
    this.dataHash     = dataHash;      // SHA-256 hash of vote data — never raw data
    this.previousHash = previousHash;
    this.nonce        = 0;
    this.hash         = this.calculateHash();
  }

  calculateHash() {
    const content = `${this.index}${this.timestamp}${this.dataHash}${this.previousHash}${this.nonce}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  // Simple proof of work: hash must start with leading zeros
  mineBlock(difficulty = 2) {
    const target = '0'.repeat(difficulty);
    while (!this.hash.startsWith(target)) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`⛏  Block ${this.index} mined: ${this.hash.slice(0, 16)}...`);
  }
}

class Blockchain {
  constructor() {
    this.chain      = [this.createGenesisBlock()];
    this.difficulty = 2;
  }

  createGenesisBlock() {
    const genesis = new Block(0, '0000000000000000', '0000000000000000');
    genesis.hash = genesis.calculateHash();
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new vote to the blockchain.
   * Only the hash of (voterId + candidateId + electionId + timestamp) is stored.
   * Raw vote data NEVER touches the chain.
   */
  addVoteBlock(voteDataHash) {
    const newBlock = new Block(
      this.chain.length,
      voteDataHash,
      this.getLatestBlock().hash
    );
    newBlock.mineBlock(this.difficulty);
    this.chain.push(newBlock);
    return newBlock;
  }

  /**
   * Validate the entire chain.
   * Checks that each block's hash is correct and previousHash links correctly.
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current  = this.chain[i];
      const previous = this.chain[i - 1];

      // Recalculate hash and compare
      const recalculated = new Block(current.index, current.dataHash, current.previousHash);
      recalculated.nonce     = current.nonce;
      recalculated.timestamp = current.timestamp;

      if (current.hash !== recalculated.calculateHash()) {
        console.error(`❌ Block ${i} hash is invalid`);
        return false;
      }

      if (current.previousHash !== previous.hash) {
        console.error(`❌ Block ${i} previousHash does not match block ${i - 1}`);
        return false;
      }
    }
    return true;
  }

  getChain() {
    return this.chain;
  }

  getBlock(index) {
    return this.chain[index] || null;
  }

  getStats() {
    return {
      totalBlocks : this.chain.length,
      isValid     : this.isChainValid(),
      latestHash  : this.getLatestBlock().hash,
      genesisHash : this.chain[0].hash,
    };
  }
}

/**
 * Hash vote data for blockchain storage.
 * Input: { voterId, candidateId, electionId, timestamp }
 * Output: SHA-256 hex string
 */
function hashVoteData({ voterId, candidateId, electionId, timestamp }) {
  const raw = `${voterId}:${candidateId}:${electionId}:${timestamp}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Singleton blockchain instance
const blockchain = new Blockchain();

module.exports = { blockchain, hashVoteData, Block, Blockchain };
