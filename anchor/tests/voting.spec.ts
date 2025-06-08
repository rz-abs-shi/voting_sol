import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair, PublicKey} from '@solana/web3.js'
import {Voting} from '../target/types/voting'
import { BankrunProvider, startAnchor } from 'anchor-bankrun';

const IDL = require('../target/idl/voting.json');

const votingAddress = new PublicKey('4XEukxWHuUJBrP93cx4ePWvjd987pSJaGtoSidPiMuWw');


describe('voting', () => {


  let context;
  let provider;
  let votingProgram: Program<Voting>;

  // TO ENTRACT WITH DEPLOYED PROGRAM 
  // let votingProgram = anchor.workspace.Voting as Program<Voting>;
  // anchor.setProvider(anchor.AnchorProvider.env());


  beforeAll(async () => {
    // TO ENTRACT WITH BANKRUN TEST PROGRAM 
    context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    provider = new BankrunProvider(context);
    votingProgram = new Program<Voting>(
      IDL,
      provider,
    );
  });
  
  it('Initialize Poll', async () => {
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

  it("Initialize Candidate", async () => {

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress
    );

    let poll = await votingProgram.account.poll.fetch(pollAddress);
    expect(poll.candidates.toNumber()).toEqual(0);

    await votingProgram.methods.initCandidate(
      new anchor.BN(1),
      "Phyciscs",
    ).rpc();

    const [phyciscsAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Phyciscs")],
      votingAddress
    );

    const physicsCandidate = await votingProgram.account.candidate.fetch(phyciscsAddress);
    expect(physicsCandidate.candidateName).toEqual('Phyciscs');
    expect(physicsCandidate.candidateVotes.toNumber()).toEqual(0);

    poll = await votingProgram.account.poll.fetch(pollAddress);
    expect(poll.candidates.toNumber()).toEqual(1);

    await votingProgram.methods.initCandidate(
      new anchor.BN(1),
      "Math",
    ).rpc();

    const [mathAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Math")],
      votingAddress
    );

    const mathCandidate = await votingProgram.account.candidate.fetch(mathAddress);
    expect(mathCandidate.candidateName).toEqual('Math');
    expect(mathCandidate.candidateVotes.toNumber()).toEqual(0);

    poll = await votingProgram.account.poll.fetch(pollAddress);
    expect(poll.candidates.toNumber()).toEqual(2);

  });

  it("Vote", async () => {

    await votingProgram.methods.vote(
      new anchor.BN(1),
      "Phyciscs",
    ).rpc();


    const [phyciscsAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Phyciscs")],
      votingAddress
    );

    const physicsCandidate = await votingProgram.account.candidate.fetch(phyciscsAddress);
    expect(physicsCandidate.candidateVotes.toNumber()).toEqual(1);

    // const [mathAddress] = PublicKey.findProgramAddressSync(
    //   [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from("Math")],
    //   votingAddress
    // );

    // const mathCandidate = await votingProgram.account.candidate.fetch(mathAddress);
    // expect(mathCandidate.candidateVotes.toNumber()).toEqual(0);

  });

});