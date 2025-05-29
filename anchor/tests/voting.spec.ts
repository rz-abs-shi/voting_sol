import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey} from '@solana/web3.js'
import {Voting} from '../target/types/voting'
import { BankrunProvider, startAnchor } from 'anchor-bankrun';

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey('coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF');


describe('voting', () => {

  it('Initialize Poll', async () => {

    const context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    const provider = new BankrunProvider(context);
  
    const votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  
    await votingProgram.methods.initPoll(
      new anchor.BN(1),
      "Which science do you prefer to delve in?",
      new anchor.BN(0),
      new anchor.BN(1841447913),
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    expect(poll.pollId.toNumber()).toEqual(1);
    expect(poll.description).toEqual('Which science do you prefer to delve in?');
    expect(poll.pollStart.toNumber()).toBeLessThan(poll.pollEnd.toNumber());
  });
});